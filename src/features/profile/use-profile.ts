import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

// profiles テーブルの行そのもの（自動生成の Database 型から導出）
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// gender は DB では check 制約付き text（未回答は null）。
// 生成型では string | null になるため、アプリ側で扱う値の集合を明示する。
export const GENDER_VALUES = ["male", "female", "other"] as const;
export type Gender = (typeof GENDER_VALUES)[number];

// フォームから保存できる項目のみを抜き出した編集用の型。
// gender は未回答（null）を許容する。
export type ProfileUpdate = {
  display_name: string | null;
  gender: Gender | null;
  birth_year: number | null;
  height_cm: number | null;
  weight_kg: number | null;
};

export type UseProfileResult = {
  /** 取得済みのプロフィール（未取得・0件時は null） */
  profile: Profile | null;
  /** 初回取得中のローディング */
  isLoading: boolean;
  /** 保存処理中のフラグ */
  isSaving: boolean;
  /** 取得・保存で発生した直近のエラーメッセージ */
  error: string | null;
  /** プロフィールを保存（存在しなければ upsert で作成）。成功可否を返す */
  save: (values: ProfileUpdate) => Promise<boolean>;
  /** 手動で再取得する */
  reload: () => Promise<void>;
};

/**
 * 自分のプロフィールの取得・更新を担うカスタムフック。
 * - 取得: 画面表示時（マウント時 / user 変更時）に自動で実行
 * - 更新: save() 呼び出し時に updated_at を now に更新して upsert
 *
 * profiles 行はサインアップ時のトリガーで自動作成される前提だが、
 * 万一 0 件でもエラーにせず、save() 時に upsert で作成できるようにしている。
 */
export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ユーザーが無いとき（ログアウト直後など）は「取得中」ではなく完了扱いにする。
  const isLoading = userId != null && isFetching;

  // 取得処理。setState は必ず非同期コールバック（.then）内で行い、effect の
  // 同期実行中には呼ばない（auth-context.tsx と同じ方針）。
  const load = useCallback((): Promise<void> => {
    if (!userId) return Promise.resolve();

    // 0 件でもエラーにしないため single() ではなく maybeSingle() を使う。
    // supabase のクエリビルダは PromiseLike のため Promise.resolve で包む。
    return Promise.resolve(
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
        .then(({ data, error: fetchError }) => {
          if (fetchError) {
            setError(fetchError.message);
            setProfile(null);
          } else {
            setError(null);
            setProfile(data);
          }
          setIsFetching(false);
        })
    );
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (values: ProfileUpdate): Promise<boolean> => {
      if (!userId) {
        setError("ログインしていないため保存できません。");
        return false;
      }

      setIsSaving(true);
      setError(null);

      // 行が無い場合にも対応できるよう update ではなく upsert を使う。
      // id は主キーなので競合時は更新、無ければ挿入される。
      const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
        id: userId,
        display_name: values.display_name,
        gender: values.gender,
        birth_year: values.birth_year,
        height_cm: values.height_cm,
        weight_kg: values.weight_kg,
        updated_at: new Date().toISOString(),
      };

      const { data, error: saveError } = await supabase
        .from("profiles")
        .upsert(payload)
        .select("*")
        .single();

      if (saveError) {
        setError(saveError.message);
        setIsSaving(false);
        return false;
      }

      setProfile(data);
      setIsSaving(false);
      return true;
    },
    [userId]
  );

  return {
    profile,
    isLoading,
    isSaving,
    error,
    save,
    reload: load,
  };
}
