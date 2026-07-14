# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

move-mate は健康維持アプリ（React Native/Expo）。就活成果物としての2人チーム開発プロジェクト。

- **筋トレ（strength）**: セット記録・履歴・Claude API によるセット提案 → [あなた] 担当
- **散歩（walk）**: ルート提案・地図・週次ミッション → [友人] 担当
- **共通基盤**: 認証・ナビゲーション・DB スキーマ → [あなた] 担当

Planned integrations: Supabase (auth + DB), Google OAuth, Google Maps Platform, Anthropic Claude API.

詳細: [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md)

## Commands

```bash
npx expo start          # Start dev server (opens QR/tunnel for Expo Go)
npx expo start --ios    # Start with iOS simulator
npx expo start --android # Start with Android emulator
npx expo start --web    # Start web browser build
npx expo lint           # Lint (uses Expo's built-in ESLint config)

# DB 型の再生成（スキーマ変更後。src/lib/database.types.ts は自動生成・手編集不可）
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

No test runner is configured yet.

## Directory Structure

新規ファイルを配置するときの基準:

```
src/
  app/(tabs)/
    strength/      # 筋トレ画面
    walk/          # 散歩画面
  features/
    strength/      # 筋トレのロジック・hooks・型
    walk/          # 散歩のロジック・hooks・型
  components/      # 共通UIコンポーネント
  lib/
    supabase.ts    # Supabase クライアント
    ai.ts          # Claude API クライアント
  constants/       # テーマ・定数
  hooks/           # 共通 hooks
```

## Architecture

### Routing
Expo Router with **file-based routing** in `src/app/`. The root `_layout.tsx` wraps the entire app in `ThemeProvider` and renders `AppTabs` — which is a platform-split component (`app-tabs.tsx` for native, `app-tabs.web.tsx` for web). New screens go in `src/app/`.

### Path Aliases
`@/*` maps to `./src/*` and `@/assets/*` maps to `./assets/*` (configured in `tsconfig.json`). Always use `@/` imports instead of relative paths.

### Theme System
- Colors, fonts, and spacing are defined in `src/constants/theme.ts`
- Fonts are platform-aware: iOS system font descriptors, web CSS variables, Android/default generic families
- Spacing uses named steps (`half`=2, `one`=4, `two`=8, `three`=16, `four`=24, `five`=32, `six`=64)
- Use `ThemedText` and `ThemedView` from `src/components/` for theme-aware UI
- Access theme colors via the `useTheme` hook in `src/hooks/use-theme.ts`

### Platform-Specific Files
Use the `.web.ts` / `.web.tsx` suffix for web-only variants (Metro and bundlers resolve these automatically). See `app-tabs.web.tsx` as the pattern.

### Styling
React Native `StyleSheet` for component styles. `src/global.css` provides CSS for web. `MaxContentWidth = 800` caps content width on wide screens; `BottomTabInset` adjusts for iOS/Android tab bar overlap.

## Development Rules

### Branch & Commit (GitHub Flow + Conventional Commits)

- ブランチ名: `feature/<scope>-<内容>` (例: `feature/strength-set-input`, `feature/walk-route-display`)
- コミット形式: `type(scope): subject`
  - type: `feat` / `fix` / `refactor` / `docs` / `chore` / `test`
  - scope: `strength` / `walk` / `common` / `infra`
  - 例: `feat(strength): add set input form`、`fix(walk): correct distance calc`

### PR Rules

- セルフレビュー禁止 — 必ず相手のレビューを受けてからマージする
- PR は機能単位で作成し、対応する Issue 番号を記載する

### Prohibited Actions

- `main` への直接 push 禁止（Branch Protection Rule で強制）
- `.env` や API キー・秘密情報をコミットしない
- Issue を立てずに大きな機能追加をしない

詳細: CONTRIBUTING.md（後で作成）

## Key Constraints
- Expo SDK 56 — read https://docs.expo.dev/versions/v56.0.0/ before writing code involving Expo APIs
- TypeScript strict mode is enabled
- `typedRoutes: true` is enabled — route strings must match actual file paths
- `reactCompiler: true` is enabled — avoid patterns that break React Compiler (manual memoization with `useMemo`/`useCallback` is usually unnecessary)
