// 筋トレの種目定義。
// DB の workouts.exercise には ExerciseId（識別子）を保存し、UI では label を表示する。
// 識別子と表示名の対応をこの一箇所に集約する。

// 識別子（id）と表示名（label）のペア。
// as const で固定し、id のユニオン型（ExerciseId）を導出する。
export const EXERCISES = [
  { id: "bench_press", label: "ベンチプレス" },
  { id: "squat", label: "スクワット" },
  { id: "deadlift", label: "デッドリフト" },
  { id: "dumbbell_press", label: "ダンベルプレス" },
  { id: "chest_press", label: "チェストプレス" },
  { id: "lat_pulldown", label: "ラットプルダウン" },
  { id: "bent_over_row", label: "ベントオーバーロウ" },
  { id: "shoulder_press", label: "ショルダープレス" },
  { id: "side_raise", label: "サイドレイズ" },
  { id: "arm_curl", label: "アームカール" },
  { id: "leg_press", label: "レッグプレス" },
  { id: "abdominal_crunch", label: "アブドミナルクランチ" },
] as const;

// 種目の識別子ユニオン型（例: "bench_press" | "squat" | ...）。
// DB への保存値・UI の選択値の双方でこの型を一貫して使う。
export type ExerciseId = (typeof EXERCISES)[number]["id"];

// id → label の逆引きマップ。変換関数から参照する。
const EXERCISE_LABELS: Record<ExerciseId, string> = Object.fromEntries(
  EXERCISES.map((exercise) => [exercise.id, exercise.label])
) as Record<ExerciseId, string>;

// 識別子から表示名を得る。未知の id（DB に残った旧データ等）はそのまま返す。
export function exerciseLabel(id: ExerciseId): string {
  return EXERCISE_LABELS[id] ?? id;
}

// 任意の文字列が有効な ExerciseId かを判定する型ガード。
export function isExerciseId(value: string): value is ExerciseId {
  return value in EXERCISE_LABELS;
}
