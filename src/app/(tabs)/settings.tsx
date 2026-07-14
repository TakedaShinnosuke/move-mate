import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import {
  useProfile,
  type Gender,
  type Profile,
  type ProfileUpdate,
} from '@/features/profile/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';

// gender の選択肢。null は「未回答」を表す。
const GENDER_OPTIONS: { value: Gender | null; label: string }[] = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: null, label: '未回答' },
];

// birth_year の下限（DB の check 制約に合わせる）
const MIN_BIRTH_YEAR = 1900;

// 数値文字列を number | null に変換する。空文字は null、数値でなければ undefined（不正）。
function parseNumber(text: string): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

type FormState = {
  displayName: string;
  gender: Gender | null;
  birthYear: string;
  heightCm: string;
  weightKg: string;
};

// プロフィール行（無ければ null）から編集フォームの初期値を作る。
function toFormState(profile: Profile | null): FormState {
  return {
    displayName: profile?.display_name ?? '',
    gender: (profile?.gender as Gender | null) ?? null,
    birthYear: profile?.birth_year != null ? String(profile.birth_year) : '',
    heightCm: profile?.height_cm != null ? String(profile.height_cm) : '',
    weightKg: profile?.weight_kg != null ? String(profile.weight_kg) : '',
  };
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const theme = useTheme();
  const { profile, isLoading, isSaving, save } = useProfile();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* アカウント情報（メールアドレス） */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            アカウント
          </ThemedText>
          <ThemedText type="default">{user?.email ?? '—'}</ThemedText>
        </ThemedView>

        {/* プロフィール編集フォーム */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            プロフィール
          </ThemedText>

          {isLoading ? (
            <ActivityIndicator style={styles.loading} />
          ) : (
            // 取得完了後にマウントし、初期値を props から直接受け取る。
            // フォームのローカル状態は子コンポーネント内で完結させる。
            <ProfileForm initial={profile} isSaving={isSaving} save={save} />
          )}
        </ThemedView>

        {/* ログアウト */}
        <Pressable
          style={[styles.button, { backgroundColor: theme.backgroundSelected }]}
          onPress={signOut}>
          <ThemedText type="default">ログアウト</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

type ProfileFormProps = {
  initial: Profile | null;
  isSaving: boolean;
  save: (values: ProfileUpdate) => Promise<boolean>;
};

function ProfileForm({ initial, isSaving, save }: ProfileFormProps) {
  const theme = useTheme();
  // 取得済みプロフィールからフォーム状態を初期化（effect 不要）
  const [form, setForm] = useState<FormState>(() => toFormState(initial));

  const currentYear = new Date().getFullYear();

  // birth_year が有効なら年齢を導出（例: 1990年（35歳））
  const birthYearNum = parseNumber(form.birthYear);
  const derivedAge =
    typeof birthYearNum === 'number' &&
    birthYearNum >= MIN_BIRTH_YEAR &&
    birthYearNum <= currentYear
      ? currentYear - birthYearNum
      : null;

  // 保存前にクライアント側で DB の check 制約に合わせて検証する。
  // 問題なければ ProfileUpdate を返し、不正なら文字列（エラーメッセージ）を返す。
  function validate(): ProfileUpdate | string {
    const birthYear = parseNumber(form.birthYear);
    if (birthYear === undefined) return '生まれた年は数値で入力してください。';
    if (
      birthYear !== null &&
      (!Number.isInteger(birthYear) || birthYear < MIN_BIRTH_YEAR || birthYear > currentYear)
    ) {
      return `生まれた年は ${MIN_BIRTH_YEAR}〜${currentYear} の範囲で入力してください。`;
    }

    const heightCm = parseNumber(form.heightCm);
    if (heightCm === undefined) return '身長は数値で入力してください。';
    if (heightCm !== null && heightCm <= 0) return '身長は 0 より大きい値を入力してください。';

    const weightKg = parseNumber(form.weightKg);
    if (weightKg === undefined) return '体重は数値で入力してください。';
    if (weightKg !== null && weightKg <= 0) return '体重は 0 より大きい値を入力してください。';

    const displayName = form.displayName.trim();

    return {
      display_name: displayName === '' ? null : displayName,
      gender: form.gender,
      birth_year: birthYear,
      height_cm: heightCm,
      weight_kg: weightKg,
    };
  }

  async function handleSave() {
    const result = validate();
    if (typeof result === 'string') {
      Alert.alert('入力エラー', result);
      return;
    }

    const ok = await save(result);
    if (ok) {
      Alert.alert('保存しました', 'プロフィールを更新しました。');
    } else {
      Alert.alert('保存に失敗しました', '時間をおいて再度お試しください。');
    }
  }

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.background }];

  return (
    <>
      {/* 表示名 */}
      <ThemedView type="backgroundElement" style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          表示名
        </ThemedText>
        <TextInput
          value={form.displayName}
          onChangeText={(displayName) => setForm((f) => ({ ...f, displayName }))}
          placeholder="表示名"
          placeholderTextColor={theme.textSecondary}
          style={inputStyle}
        />
      </ThemedView>

      {/* 性別（選択式） */}
      <ThemedView type="backgroundElement" style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          性別
        </ThemedText>
        <ThemedView type="backgroundElement" style={styles.genderRow}>
          {GENDER_OPTIONS.map((option) => {
            const selected = form.gender === option.value;
            return (
              <Pressable
                key={option.label}
                onPress={() => setForm((f) => ({ ...f, gender: option.value }))}
                style={[
                  styles.genderChip,
                  { backgroundColor: selected ? theme.backgroundSelected : theme.background },
                ]}>
                <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>
      </ThemedView>

      {/* 生まれた年 + 年齢の補助表示 */}
      <ThemedView type="backgroundElement" style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          生まれた年
          {derivedAge != null ? `（${form.birthYear}年 / ${derivedAge}歳）` : ''}
        </ThemedText>
        <TextInput
          value={form.birthYear}
          onChangeText={(birthYear) => setForm((f) => ({ ...f, birthYear }))}
          placeholder="例: 1990"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          style={inputStyle}
        />
      </ThemedView>

      {/* 身長 */}
      <ThemedView type="backgroundElement" style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          身長 (cm)
        </ThemedText>
        <TextInput
          value={form.heightCm}
          onChangeText={(heightCm) => setForm((f) => ({ ...f, heightCm }))}
          placeholder="例: 170"
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          style={inputStyle}
        />
      </ThemedView>

      {/* 体重 */}
      <ThemedView type="backgroundElement" style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          体重 (kg)
        </ThemedText>
        <TextInput
          value={form.weightKg}
          onChangeText={(weightKg) => setForm((f) => ({ ...f, weightKg }))}
          placeholder="例: 60"
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          style={inputStyle}
        />
      </ThemedView>

      {/* 保存ボタン */}
      <Pressable
        disabled={isSaving}
        onPress={handleSave}
        style={[
          styles.button,
          { backgroundColor: theme.backgroundSelected, opacity: isSaving ? 0.6 : 1 },
        ]}>
        {isSaving ? <ActivityIndicator /> : <ThemedText type="default">保存</ThemedText>}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    alignSelf: 'stretch',
    maxWidth: MaxContentWidth,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  loading: {
    paddingVertical: Spacing.four,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  genderChip: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
});
