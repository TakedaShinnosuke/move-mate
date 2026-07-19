import { ActivityIndicator, SectionList, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { exerciseLabel } from "@/features/strength/exercises";
import {
  toLocalDateKey,
  type WorkoutHistoryDay,
  type WorkoutHistoryExercise,
} from "@/features/strength/use-workout-history";

// 曜日の日本語表記（Date.getDay(): 0=日曜）。
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

// dateKey（"YYYY-MM-DD"）を表示ラベルへ変換する。当日は「今日」を返す。
function formatDateLabel(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return "今日";

  const [year, month, day] = dateKey.split("-").map(Number);
  // ローカル正午で Date を生成し曜日を求める（DST 等の境界を避けるため 0:00 は使わない）。
  const date = new Date(year, month - 1, day, 12);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  return `${month}月${day}日（${weekday}）`;
}

// 総挙上量を桁区切りで表示する。小数は最大1桁に丸める（例: 1,250 / 1,262.5）。
function formatVolume(volume: number): string {
  const rounded = Math.round(volume * 10) / 10;
  return rounded.toLocaleString("ja-JP");
}

type Section = {
  dateKey: string;
  data: WorkoutHistoryExercise[];
};

export type HistoryViewProps = {
  history: WorkoutHistoryDay[];
  isLoading: boolean;
  error: string | null;
};

export function HistoryView({ history, isLoading, error }: HistoryViewProps) {
  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small" themeColor="textSecondary">
          履歴の取得に失敗しました
        </ThemedText>
      </ThemedView>
    );
  }

  if (history.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="small" themeColor="textSecondary">
          まだ記録がありません
        </ThemedText>
      </ThemedView>
    );
  }

  // 当日判定のため、レンダー時点のローカル日付キーを求める。
  const todayKey = toLocalDateKey(new Date().toISOString());
  const sections: Section[] = history.map((day) => ({
    dateKey: day.dateKey,
    data: day.exercises,
  }));

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.exercise}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionHeader}>
          {formatDateLabel(section.dateKey, todayKey)}
        </ThemedText>
      )}
      renderItem={({ item }) => <ExerciseCard group={item} />}
    />
  );
}

// 1 種目分のカード。種目名・総挙上量サマリと各セットの明細を表示する。
function ExerciseCard({ group }: { group: WorkoutHistoryExercise }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.cardHeader}>
        <ThemedText type="default">{exerciseLabel(group.exercise)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          総挙上量 {formatVolume(group.totalVolume)} kg
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.setList}>
        {group.sets.map((set) => (
          <ThemedText key={set.id} type="small" themeColor="textSecondary">
            {set.set_number} セット目: {set.weight_kg}kg × {set.reps}回
          </ThemedText>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeader: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: Spacing.two,
  },
  setList: {
    gap: Spacing.half,
  },
});
