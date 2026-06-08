# Contributing Guide

## 1. はじめに

### 本ドキュメントの位置づけ

| ドキュメント | 目的 |
|---|---|
| `README.md` | プロジェクト概要・セットアップ手順 |
| `CLAUDE.md` | Claude Code 向けの簡潔な開発規約 |
| **本ドキュメント（CONTRIBUTING.md）** | 実際の開発作業を進めるためのリファレンス |

詳細な背景・技術スタック・MVP スコープは [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) を参照してください。

### 対象読者

本プロジェクトのコントリビューター（特に初参加者）を想定しています。  
Git / GitHub の基本操作（clone, add, commit, push, pull）は理解済みであることを前提とします。

---

## 2. 開発フロー全体像

本プロジェクトは **GitHub Flow** を採用しています。

```
main（常にデプロイ可能な状態）
  └─ feature/strength-set-input   ← 機能ブランチで作業
       └─ コミットを積む
           └─ Pull Request を作成
               └─ レビュー・修正
                   └─ main にマージ
```

### 1機能の実装サイクル

1. **Issue 作成** — 何を作るか・修正するかを記録する
2. **ブランチ作成** — Issue に対応したブランチを `main` から切る
3. **開発** — コミットを小さく積みながら実装する
4. **PR 作成** — 完成したら Pull Request を出す（作業中は Draft PR でもよい）
5. **レビュー** — 相手にレビューを依頼し、指摘を受けて修正する
6. **マージ** — LGTM をもらったら `main` にマージする

---

## 3. Issue 作成のルール

### いつ Issue を立てるか

- 新機能の実装を始める前
- バグを発見したとき
- 既存機能の改善・リファクタリングをしたいとき
- ドキュメントを更新したいとき

> **ルール**: 大きな機能変更は必ず先に Issue を立ててから着手する。

### タイトルの書き方

`[スコープ] 内容` の形式で、名詞中心・簡潔に書く。

```
[strength] セット入力フォームの実装
[walk] 位置情報取得時のエラー処理
[common] Supabase 認証フローの実装
[infra] 環境変数の管理方法を整備
```

### ラベル

| ラベル | 意味 |
|---|---|
| `strength` | 筋トレ機能 |
| `walk` | 散歩機能 |
| `common` | 共通機能（認証・ナビゲーションなど） |
| `infra` | 設定・ツール・依存パッケージ |
| `bug` | バグ |
| `enhancement` | 既存機能の改善 |

### 担当者

Issue を着手したら自分を Assignee に設定する。

---

## 4. ブランチ運用

### 命名規約

```
feature/<scope>-<内容>   # 新機能
fix/<scope>-<内容>       # バグ修正
docs/<内容>              # ドキュメント
chore/<内容>             # 設定・依存更新など
```

`<scope>` は `strength` / `walk` / `common` / `infra` のいずれか。

```bash
# 例
feature/strength-set-input
feature/walk-route-display
fix/walk-distance-calculation
docs/update-readme-setup
chore/upgrade-expo-sdk
```

### ルール

- **1機能1ブランチ** — 複数の無関係な変更を1ブランチに混ぜない
- **短命ブランチを心がける** — 理想は1〜3日。長期化するとコンフリクトが増える
- **`main` への直接 push は禁止** — Branch Protection Rule で強制されている

---

## 5. コミット規約（Conventional Commits）

### 形式

```
type(scope): subject
```

### type の一覧

| type | 用途 |
|---|---|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `refactor` | 動作を変えないコードの整理 |
| `docs` | ドキュメントの変更 |
| `chore` | 設定・依存パッケージの更新など |
| `test` | テストの追加・修正 |

### subject のルール

- **50文字以内**
- **英語**（scope や type も英語）
- **現在形**（`add` ✓ / `added` ✗）
- **文頭小文字**（`add` ✓ / `Add` ✗）
- **ピリオドなし**

### 例

```bash
feat(strength): add set input form
fix(walk): correct distance calculation
refactor(common): extract auth logic into hook
docs: update README with setup instructions
chore(infra): upgrade expo-router to 4.x
```

### 詳細な説明が必要なとき

1行目（subject）のあとに空行を挟み、本文に書く。

```
fix(walk): handle location permission denial

Previously the app crashed when the user denied location permission.
Now it shows an error message and falls back to a manual input form.
```

### 1コミット1論点

機能追加とバグ修正を同じコミットに混ぜない。変更の目的が1つになるよう分割する。

---

## 6. Pull Request の作成

### タイトル

コミット規約と同形式で書く。

```
feat(strength): add set input form
fix(walk): correct distance calculation
```

### 説明文のテンプレート

```markdown
## 概要

（何を・なぜ変更したかを2〜3文で）

## 変更内容

- 変更点1
- 変更点2

## 動作確認

- [ ] iOS（実機 or シミュレータ）で確認済み
- [ ] Android（実機 or エミュレータ）で確認済み

（スクリーンショットや動画があれば添付）

## 関連 Issue

Closes #XX

## レビュアーへのメモ

（特に見てほしいポイント、迷った箇所、懸念事項など）
```

### Draft PR の活用

作業中は **Draft PR** として出すことを推奨する。進捗を共有でき、早めにフィードバックをもらえる。  
レビュー依頼の準備ができたら「Ready for review」に切り替える。

### セルフマージ禁止

自分の PR を自分でマージしない。必ず相手の LGTM を得てからマージする。

---

## 7. コードレビュー

### 依頼のしかた

PR を Ready for review に変更し、Discord でレビュー依頼の声かけをする。

### レビュー観点

- 機能要件（Issue の内容）を満たしているか
- 既存コードと整合しているか（命名・ディレクトリ構成・スタイル）
- `docs/PROJECT_BRIEF.md` / `CLAUDE.md` のルールに準拠しているか
- 明らかなバグ・パフォーマンス問題がないか
- テスト可能な構造になっているか

### コメントの書き方

改善を提案するときは**理由をセットで**書く。

```
# 良い例
この関数は副作用があるので、hooks に切り出した方が React Compiler と相性がよいです。
`useStrengthHistory` のような名前で src/features/strength/ に置きましょう。

# 避けたい例
関数に切り出してください。
```

### LGTM のみは避ける

短くてよいので所感を一言添える。「ロジックが読みやすかった」「この命名いいですね」でも十分。

---

## 8. コードスタイル

### 基本ルール

- **TypeScript strict mode** 準拠（`tsconfig.json` で有効化済み）
- `npx expo lint` を通してから PR を出す
- インポートは `@/` エイリアスを使用し、相対パスは使わない

```typescript
// Good
import { ThemedText } from '@/components/ThemedText';

// Bad
import { ThemedText } from '../../components/ThemedText';
```

### 命名規約

| 対象 | 規約 | 例 |
|---|---|---|
| コンポーネント | PascalCase | `SetInputForm` |
| ファイル名（コンポーネント） | kebab-case | `set-input-form.tsx` |
| hooks | `use` + camelCase | `useStrengthHistory` |
| 型・interface | PascalCase | `WorkoutSet` |

### Theme システム

テキストや背景色はハードコードせず、必ず Theme システムを通じて指定する。

```typescript
// テキスト・背景には ThemedText / ThemedView を使う
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// 色・スペーシングが必要なら useTheme hook を使う
import { useTheme } from '@/hooks/use-theme';
```

### ファイルの配置

| 種別 | 置き場所 |
|---|---|
| 画面コンポーネント | `src/app/(tabs)/strength/` or `walk/` |
| 機能ロジック・hooks・型 | `src/features/strength/` or `walk/` |
| 共通 UI コンポーネント | `src/components/` |
| 共通 hooks | `src/hooks/` |
| 定数・テーマ | `src/constants/` |

---

## 9. 環境変数とシークレットの取り扱い

- **`.env` はコミット禁止**（`.gitignore` で除外済み）
- `.env.example` に変数名のみ（実値なし）を記載してコミットする
- 新しい環境変数を追加したら、PR の説明文で「追加した環境変数: `EXPO_PUBLIC_XXX`」と明記する
- 実値は **Discord** でチームメンバーに共有する

```bash
# .env.example の例（実値は書かない）
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
ANTHROPIC_API_KEY=
```

---

## 10. Claude Code との協業

本プロジェクトでは両者が Claude Code を開発支援ツールとして利用する。

- プロジェクト規約は `CLAUDE.md` に集約してあり、Claude Code はこれを自動参照する
- **大きな機能を任せる前に Issue を立て**、設計方針を固めてから依頼する
- Claude Code が出力する差分は必ずレビューする（特に既存ロジックへの変更、型定義の変更）
- コミットメッセージは「人が書いた前提」で読まれる。Claude Code が生成した文面をそのまま使わず、自分の言葉に直すか内容を確認してから使う

---

## 11. よくある操作のコマンド集

### 機能ブランチを作って作業開始

```bash
# main を最新にしてからブランチを切る
git switch main
git pull origin main
git switch -c feature/strength-set-input
```

### main の最新を取り込む（作業中ブランチで）

```bash
# fetch して main をマージする方法
git fetch origin
git merge origin/main

# または rebase（コミット履歴をきれいに保ちたい場合）
git fetch origin
git rebase origin/main
```

> **rebase とは？** 自分のコミットを「main の最新の上に積み直す」操作。  
> `merge` はマージコミットが残るが、`rebase` は履歴が一直線になる。  
> どちらでも機能的には同じなので、慣れていない場合は `merge` でよい。

### PR を作成する（GitHub Web UI）

1. ブランチを push する: `git push origin feature/strength-set-input`
2. GitHub のリポジトリページを開くと「Compare & pull request」ボタンが表示される
3. タイトル・説明文を入力し「Create pull request」（作業中なら「Create draft pull request」）

gh CLI を使う場合:

```bash
# gh CLI がインストール済みの場合
gh pr create --title "feat(strength): add set input form" --draft
```

### コンフリクトが発生した場合

```bash
# merge 後にコンフリクトが出た場合
git status          # コンフリクトしているファイルを確認
# エディタでファイルを開き、<<<< ==== >>>> の箇所を手動で解決する
git add <解決したファイル>
git merge --continue
```

> **コンフリクト（conflict）とは？** 同じファイルの同じ箇所を2人が別々に変更したとき発生する。  
> Git がどちらの変更を使うべきか判断できないため、人が手動で解決する必要がある。  
> わからなければ Discord で相談してください。
