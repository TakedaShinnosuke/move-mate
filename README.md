# move-mate

筋トレと散歩の2機能で日常の運動習慣をサポートする健康維持アプリ（React Native + Expo）。

## ステータス

🚧 **Active development** — 2人チームで MVP を開発中

## 開発の目的

- 就職活動向けの成果物として、フルスタック開発・チーム開発の経験を積む
- 実際に自分たちが使う「ドッグフーディング」可能なアプリを作る
- React Native / Supabase / AI API を実務に近い形で扱い、モダン技術スタックの実務経験を得る
- Git/GitHub を用いた本格的なチーム開発フロー（PR レビュー・Issue 管理）を経験する

## 主要機能

### 筋トレ機能

- BIG3 をはじめとする主要種目をシードデータとして初期登録
- セット記録（種目選択・重量・回数・セット数の入力）
- 日付別の履歴閲覧
- Claude API による次回推奨セットの AI 提案

### 散歩機能

- 現在地取得と散歩時間・距離の入力
- 性別・年齢などのユーザー属性を考慮したルート提案（推奨ペース・消費カロリー目安）
- Google Maps 上でのルート表示と散歩履歴の記録
- 週次ミッション（週次で自動選択・進捗バー表示・達成判定・自動リセット）

### 共通機能

- Google ログイン / ログアウト（Supabase Auth 経由）
- タブナビゲーション（筋トレ / 散歩 / 設定）
- ユーザープロフィール（氏名・性別・年齢・身長・体重）

## 技術スタック

| 領域             | 採用技術                                 |
| ---------------- | ---------------------------------------- |
| フレームワーク   | React Native + Expo SDK 56 + Expo Router |
| 言語             | TypeScript（strict mode）                |
| バックエンド・DB | Supabase（PostgreSQL + Auth + Storage）  |
| 認証             | Google OAuth（Supabase Auth 経由）       |
| 地図             | Google Maps Platform / react-native-maps |
| AI               | Anthropic Claude API                     |
| バージョン管理   | Git + GitHub                             |
| 開発支援         | Claude Code                              |
| エディタ         | VS Code                                  |

## セットアップ

### 共通前提

- [Git](https://git-scm.com/) がインストール済みであること
- GitHub アカウントを保有していること

```bash
git clone https://github.com/TakedaShinnosuke/move-mate.git
cd move-mate
```

---

### Windows + WSL2 の場合

**前提**: Windows 11 + WSL2（Ubuntu 24.04 LTS）

```bash
# 必要な apt パッケージを更新・追加
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential

# nvm をインストールして Node.js v22 を導入
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22

# Claude Code をグローバルインストール
npm install -g @anthropic-ai/claude-code
```

---

### macOS の場合

**前提**: macOS（Apple Silicon / Intel どちらも可）

```bash
# Homebrew が未導入の場合
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Xcode Command Line Tools
xcode-select --install

# nvm をインストールして Node.js v22 を導入
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.zshrc
nvm install 22
nvm use 22

# Claude Code をグローバルインストール
npm install -g @anthropic-ai/claude-code
```

---

### 共通（環境構築後）

```bash
# 依存パッケージのインストール
npm install

# 環境変数ファイルを作成（.env.example をコピーして編集）
cp .env.example .env
# .env を開き、各 API キーを設定する
```

> ※ `.env.example` は Supabase・Google OAuth・Anthropic API の連携時に追加されます（現状は未作成）。それまで `.env` の用意はスキップして開発サーバーを起動できます。

```bash
# 実機テストには App Store または Google Play から Expo Go アプリをインストールしてください

# 開発サーバーを起動
npx expo start
```

## 開発コマンド

```bash
npx expo start           # 開発サーバー起動（QR / Expo Go）
npx expo start --ios     # iOS シミュレーターで起動
npx expo start --android # Android エミュレーターで起動
npx expo start --web     # Web ブラウザで起動
npx expo lint            # リント実行
```

## プロジェクト構造

```
src/
  app/(tabs)/
    strength/      # 筋トレ画面
    walk/          # 散歩画面
  features/
    strength/      # 筋トレのロジック・hooks・型
    walk/          # 散歩のロジック・hooks・型
  components/      # 共通 UI コンポーネント
  lib/
    supabase.ts    # Supabase クライアント
    ai.ts          # Claude API クライアント
  constants/       # テーマ・定数
  hooks/           # 共通 hooks
```

アーキテクチャの詳細は [CLAUDE.md](CLAUDE.md) を参照してください。

## 開発フロー

ブランチ運用・コミット規約・PR ルールの詳細は CONTRIBUTING.md（後で作成）を参照してください。

## ライセンス

MIT — 詳細は [LICENSE](LICENSE) ファイルを参照してください。

## リンク

- [プロジェクト計画書](docs/PROJECT_BRIEF.md)
- [開発ガイド（CLAUDE.md）](CLAUDE.md)
- [コントリビューションガイド（CONTRIBUTING.md）](CONTRIBUTING.md)（後で作成）
