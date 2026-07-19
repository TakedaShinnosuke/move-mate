import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { ExerciseId } from "@/features/strength/exercises";
import type { WorkoutSet } from "@/features/strength/use-workout-log";

// 履歴として取得する最大件数。件数が増えても描画側は FlatList/SectionList で
// 仮想化するが、取得負荷を抑えるため直近 100 件に絞る。
const HISTORY_LIMIT = 100;

// 1 種目分のまとまり。同一日・同一種目のセットを昇順で保持する。
export type WorkoutHistoryExercise = {
  exercise: ExerciseId;
  /** set_number 昇順に並べたセット */
  sets: WorkoutSet[];
  /** 総挙上量（Σ weight_kg × reps） */
  totalVolume: number;
};

// 1 日分のまとまり。dateKey は端末ローカル日付（"YYYY-MM-DD"）。
export type WorkoutHistoryDay = {
  /** 端末ローカル日付キー（"YYYY-MM-DD"）。表示ラベルはこのキーから導出する */
  dateKey: string;
  /** その日に記録した種目のまとまり（新しい記録順） */
  exercises: WorkoutHistoryExercise[];
};

export type UseWorkoutHistoryResult = {
  /** 「ローカル日付 → 種目 → セット昇順」に整形済みの履歴（新しい日付順） */
  history: WorkoutHistoryDay[];
  /** 初回取得中のローディング */
  isLoading: boolean;
  /** 取得で発生した直近のエラーメッセージ */
  error: string | null;
  /** 手動で再取得する（履歴タブへの切り替え時などに呼ぶ） */
  reload: () => Promise<void>;
};

/**
 * ISO 文字列（DB は UTC 保存）を端末ローカル日付キー "YYYY-MM-DD" に変換する。
 * getFullYear/getMonth/getDate はローカルタイムで値を返すため、
 * これらから組み立てることで UTC と日付境界がずれる問題を避ける。
 */
export function toLocalDateKey(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * フラットなセット一覧を「ローカル日付 → 種目 → セット昇順」の構造にグルーピングする純粋関数。
 *
 * 前提: 入力 sets は performed_at 降順（新しい順）で並んでいる。
 * この順序を活かし、Map の挿入順で「日付は新しい順」「種目はその日で新しく記録した順」を保つ。
 * セットのみ最終的に set_number 昇順へ並べ替える（1セット目 → 2セット目…の自然な閲覧順）。
 *
 * @param sets performed_at 降順のセット一覧
 * @returns 新しい日付順にまとめた履歴
 */
export function groupWorkoutHistory(sets: WorkoutSet[]): WorkoutHistoryDay[] {
  // dateKey → (exercise → その種目のセット配列)。Map で挿入順を保持する。
  const dayMap = new Map<string, Map<ExerciseId, WorkoutSet[]>>();

  for (const set of sets) {
    const dateKey = toLocalDateKey(set.performed_at);

    let exerciseMap = dayMap.get(dateKey);
    if (!exerciseMap) {
      exerciseMap = new Map<ExerciseId, WorkoutSet[]>();
      dayMap.set(dateKey, exerciseMap);
    }

    const existing = exerciseMap.get(set.exercise);
    if (existing) {
      existing.push(set);
    } else {
      exerciseMap.set(set.exercise, [set]);
    }
  }

  const days: WorkoutHistoryDay[] = [];
  for (const [dateKey, exerciseMap] of dayMap) {
    const exercises: WorkoutHistoryExercise[] = [];

    for (const [exercise, exerciseSets] of exerciseMap) {
      // 閲覧しやすいよう set_number 昇順に並べ替える（元配列は破壊しない）。
      const sortedSets = [...exerciseSets].sort(
        (a, b) => a.set_number - b.set_number
      );
      const totalVolume = sortedSets.reduce(
        (sum, s) => sum + s.weight_kg * s.reps,
        0
      );
      exercises.push({ exercise, sets: sortedSets, totalVolume });
    }

    days.push({ dateKey, exercises });
  }

  return days;
}

/**
 * 自分の筋トレ履歴（直近 100 件）の取得を担うカスタムフック。
 * - 取得: 画面表示時（マウント時 / user 変更時）に自動で実行
 * - 整形: 取得したフラットなセットを groupWorkoutHistory で日付・種目単位にまとめて返す
 *
 * setState は必ず非同期コールバック（.then）内で行い、effect の同期実行中には
 * 呼ばない（use-workout-log.ts / use-profile.ts と同じ方針）。
 */
export function useWorkoutHistory(): UseWorkoutHistoryResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ユーザーが無いとき（ログアウト直後など）は「取得中」ではなく完了扱いにする。
  const isLoading = userId != null && isFetching;

  const load = useCallback((): Promise<void> => {
    if (!userId) return Promise.resolve();

    // supabase のクエリビルダは PromiseLike のため Promise.resolve で包む。
    return Promise.resolve(
      supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .order("performed_at", { ascending: false })
        .limit(HISTORY_LIMIT)
        .then(({ data, error: fetchError }) => {
          if (fetchError) {
            setError(fetchError.message);
            setSets([]);
          } else {
            setError(null);
            setSets((data ?? []) as WorkoutSet[]);
          }
          setIsFetching(false);
        })
    );
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // 取得結果を整形。純粋関数のため React Compiler が再計算をメモ化する。
  const history = groupWorkoutHistory(sets);

  return {
    history,
    isLoading,
    error,
    reload: load,
  };
}
