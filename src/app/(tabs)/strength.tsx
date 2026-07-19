import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import {
  EXERCISES,
  exerciseLabel,
  type ExerciseId,
} from "@/features/strength/exercises";
import { useWorkoutLog, type WorkoutSet } from "@/features/strength/use-workout-log";
import { useTheme } from "@/hooks/use-theme";

// 数値文字列を number に変換する。空文字・非数値は undefined（不正）を返す。
function parseNumber(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

export default function StrengthScreen() {
  const theme = useTheme();
  const { todaySets, isLoading, isSaving, lastSetNumber, saveSet } = useWorkoutLog();

  // 種目・重量・回数はセット保存後も保持し、連続入力の手数を減らす。
  const [exercise, setExercise] = useState<ExerciseId>(EXERCISES[0].id);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  // 直近の保存成功メッセージ（インラインの成功フィードバック）。
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // 選択中の種目における次のセット番号（当日の最終 +1）。
  // 種目を切り替えると当該種目の状態に自動でリセットされる。
  const nextSetNumber = lastSetNumber(exercise) + 1;

  async function handleSave() {
    const weightKg = parseNumber(weight);
    if (weightKg === undefined || weightKg < 0) {
      Alert.alert("入力エラー", "重量は 0 以上の数値で入力してください。");
      return;
    }

    const repsNum = parseNumber(reps);
    if (repsNum === undefined || !Number.isInteger(repsNum) || repsNum < 1) {
      Alert.alert("入力エラー", "回数は 1 以上の整数で入力してください。");
      return;
    }

    const saved = await saveSet({
      exercise,
      weight_kg: weightKg,
      reps: repsNum,
      set_number: nextSetNumber,
    });

    if (saved) {
      // 種目・重量・回数は保持。次のセット番号は todaySets の更新で自動加算される。
      setSavedMessage(
        `${exerciseLabel(exercise)} ${saved.set_number}セット目を記録しました`
      );
    } else {
      Alert.alert("保存に失敗しました", "時間をおいて再度お試しください。");
    }
  }

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.background },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* 種目選択（12種目・チップ。片手操作しやすい大きめのタップ領域） */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              種目
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.chipRow}>
              {EXERCISES.map((item) => {
                const selected = exercise === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setExercise(item.id);
                      setSavedMessage(null);
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected
                          ? theme.backgroundSelected
                          : theme.background,
                      },
                    ]}>
                    <ThemedText
                      type="small"
                      themeColor={selected ? "text" : "textSecondary"}>
                      {item.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ThemedView>
          </ThemedView>

          {/* 重量・回数の入力 */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedView type="backgroundElement" style={styles.inputRow}>
              <ThemedView type="backgroundElement" style={styles.inputField}>
                <ThemedText type="small" themeColor="textSecondary">
                  重量 (kg)
                </ThemedText>
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="例: 60"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                />
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.inputField}>
                <ThemedText type="small" themeColor="textSecondary">
                  回数
                </ThemedText>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  placeholder="例: 10"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  style={inputStyle}
                />
              </ThemedView>
            </ThemedView>

            <ThemedText type="small" themeColor="textSecondary">
              次は {nextSetNumber} セット目
            </ThemedText>

            <Pressable
              disabled={isSaving}
              onPress={handleSave}
              style={[
                styles.button,
                {
                  backgroundColor: theme.backgroundSelected,
                  opacity: isSaving ? 0.6 : 1,
                },
              ]}>
              {isSaving ? (
                <ActivityIndicator />
              ) : (
                <ThemedText type="default">
                  {nextSetNumber} セット目を記録
                </ThemedText>
              )}
            </Pressable>

            {savedMessage ? (
              <ThemedText type="small" themeColor="textSecondary">
                {savedMessage}
              </ThemedText>
            ) : null}
          </ThemedView>

          {/* 今日の記録（簡易表示。本格的な履歴は別画面） */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              今日の記録
            </ThemedText>
            {isLoading ? (
              <ActivityIndicator style={styles.loading} />
            ) : todaySets.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                まだ記録がありません
              </ThemedText>
            ) : (
              // 直近のセットを上に表示する。
              [...todaySets].reverse().map((set) => <SetRow key={set.id} set={set} />)
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SetRow({ set }: { set: WorkoutSet }) {
  return (
    <ThemedView type="backgroundElement" style={styles.setRow}>
      <ThemedText type="default">{exerciseLabel(set.exercise)}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {set.weight_kg}kg × {set.reps}回 ・ {set.set_number}セット目
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  safeArea: {
    flex: 1,
    alignSelf: "stretch",
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  inputField: {
    flex: 1,
    gap: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
  },
  loading: {
    paddingVertical: Spacing.three,
  },
  setRow: {
    gap: Spacing.half,
  },
});
