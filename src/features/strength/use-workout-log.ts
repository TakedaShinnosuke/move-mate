import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import type { ExerciseId } from "@/features/strength/exercises";

// workouts テーブルの行そのもの（自動生成の Database 型から導出）。
// exercise 列は DB 上 string だが、アプリ内では ExerciseId として扱いたいので
// Row の exercise を ExerciseId に絞り込んだ型を公開する。
type WorkoutRow = Database["public"]["Tables"]["workouts"]["Row"];
export type WorkoutSet = Omit<WorkoutRow, "exercise"> & { exercise: ExerciseId };

// セット保存に必要な入力。performed_at と user_id は hook 側で付与するため受け取らない。
export type SaveSetInput = {
  exercise: ExerciseId;
  weight_kg: number;
  reps: number;
  set_number: number;
};

export type UseWorkoutLogResult = {
  /** 本日保存済みのセット（performed_at 昇順）。画面下部の簡易表示に使う */
  todaySets: WorkoutSet[];
  /** 本日分の初回取得中のローディング */
  isLoading: boolean;
  /** 保存処理中のフラグ */
  isSaving: boolean;
  /** 取得・保存で発生した直近のエラーメッセージ */
  error: string | null;
  /**
   * 指定種目の「本日の最終 set_number」を返す（未記録なら 0）。
   * 次に記録すべきセット番号は +1 で求められる（連続入力時の自動インクリメント用）。
   */
  lastSetNumber: (exercise: ExerciseId) => number;
  /** 1 セット保存する。成功時は保存された行を返し、失敗時は null を返す */
  saveSet: (input: SaveSetInput) => Promise<WorkoutSet | null>;
  /** 手動で本日分を再取得する */
  reload: () => Promise<void>;
};

// 端末のローカル日付における「本日 0:00」の ISO 文字列を返す。
// performed_at >= この値 で当日分を絞り込む。
function startOfTodayISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

/**
 * 筋トレのセット記録（保存・当日分の取得）を担うカスタムフック。
 * - 取得: 画面表示時（マウント時 / user 変更時）に本日分を自動取得
 * - 保存: saveSet() で 1 セット insert し、成功時はローカルの todaySets に追記する
 *
 * set_number の自動インクリメントは todaySets から lastSetNumber() で導出する方式。
 * これにより画面を開いた時点で当日の既存セット数が反映される。
 */
export function useWorkoutLog(): UseWorkoutLogResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [todaySets, setTodaySets] = useState<WorkoutSet[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ユーザーが無いとき（ログアウト直後など）は「取得中」ではなく完了扱いにする。
  const isLoading = userId != null && isFetching;

  // 本日分の取得。setState は必ず非同期コールバック（.then）内で行い、
  // effect の同期実行中には呼ばない（use-profile.ts と同じ方針）。
  const load = useCallback((): Promise<void> => {
    if (!userId) return Promise.resolve();

    // supabase のクエリビルダは PromiseLike のため Promise.resolve で包む。
    return Promise.resolve(
      supabase
        .from("workouts")
        .select("*")
        .eq("user_id", userId)
        .gte("performed_at", startOfTodayISO())
        .order("performed_at", { ascending: true })
        .then(({ data, error: fetchError }) => {
          if (fetchError) {
            setError(fetchError.message);
            setTodaySets([]);
          } else {
            setError(null);
            setTodaySets((data ?? []) as WorkoutSet[]);
          }
          setIsFetching(false);
        })
    );
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // 指定種目の本日の最終 set_number（未記録なら 0）。
  const lastSetNumber = useCallback(
    (exercise: ExerciseId): number =>
      todaySets
        .filter((set) => set.exercise === exercise)
        .reduce((max, set) => Math.max(max, set.set_number), 0),
    [todaySets]
  );

  const saveSet = useCallback(
    async (input: SaveSetInput): Promise<WorkoutSet | null> => {
      if (!userId) {
        setError("ログインしていないため保存できません。");
        return null;
      }

      setIsSaving(true);
      setError(null);

      const payload: Database["public"]["Tables"]["workouts"]["Insert"] = {
        user_id: userId,
        exercise: input.exercise,
        weight_kg: input.weight_kg,
        reps: input.reps,
        set_number: input.set_number,
        performed_at: new Date().toISOString(),
      };

      const { data, error: saveError } = await supabase
        .from("workouts")
        .insert(payload)
        .select("*")
        .single();

      if (saveError) {
        setError(saveError.message);
        setIsSaving(false);
        return null;
      }

      const saved = data as WorkoutSet;
      // 保存済みリストに追記（performed_at 昇順を維持）。
      setTodaySets((prev) => [...prev, saved]);
      setIsSaving(false);
      return saved;
    },
    [userId]
  );

  return {
    todaySets,
    isLoading,
    isSaving,
    error,
    lastSetNumber,
    saveSet,
    reload: load,
  };
}
