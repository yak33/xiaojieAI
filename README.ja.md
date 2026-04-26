# xiaojieAI

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

xiaojieAI は、企業内業務システム（通関、ERP、OA など）向けの **AI 基盤 / オーケストレーション層** です。既存の業務システムを置き換えるのではなく、組み込み型アシスタントと統一バックエンドの形で、自然言語、ナレッジ検索、将来のツール呼び出し、ポリシー制御を一つのサービスに集約し、任意のホストシステムに統合できるようにすることを目的としています。

## ポジショニング

- 単一業務システム向けの「チャットプラグイン」**ではなく**
- グループ全体の AI 能力プラットフォームとして、バックエンドの骨格と組み込みアシスタントコンポーネントを提供します
- 業務事実は引き続き各業務システムが保持し、xiaojieAI は対話・知識・能力オーケストレーション・監査を担います

## 現在の機能

- POST + DTO 化された同期対話 API、`conversationId / tenantId / userId / systemCode` をプロトコル予約フィールドとして用意
- SSE による名前付きイベントのストリーミング応答（`meta` / `delta` / `done` / `error`）
- plain / RAG の二系統 ChatClient と、差し替え可能な `RagRoutingPolicy` ルーティング戦略
- 通関ドメインのキーワード集合と業務番号の正規表現によるデフォルトルーティング判定（14 ケースの table-driven 単体テスト付き）
- ナレッジ文書の単体・一括登録（`/ai/knowledge`, `/ai/knowledge/batch`）
- Mission Control 系の組み込み型アシスタントコンポーネント：side / floating / fullscreen の三状態、ライト / ダーク両テーマ対応
- 統合デモページ：通関 / ERP / OA の三種ホストブランドを切り替え、非侵襲的な埋め込みを検証
- ナレッジ管理画面：単体 / 一括登録、フィルター、ローカルビュー、`.md` / `.txt` ドラッグ＆ドロップ

## 技術スタック

- Java 21
- Spring Boot 3.5.x
- Spring AI 1.1.x
- Spring AI Alibaba DashScope（chat & embedding）
- Qdrant Vector Store
- フロントエンド：素の HTML / CSS / JS（現時点で Vue / React は未導入）

## プロジェクト構成

```text
src/main/java/io/github/yak33/xiaojieai/
├── XiaojieAiApplication.java
├── config/
│   └── AiClientConfiguration.java          # plain / rag 二系統 ChatClient の構築
├── controller/
│   └── AiAssistantController.java          # REST エンドポイント
├── dto/
│   ├── ChatCommand.java                    # リクエスト record（予約フィールド含む）
│   └── ChatReply.java                      # 同期レスポンス record
├── routing/
│   ├── RagRoutingPolicy.java               # ルーティング戦略インターフェース
│   └── KeywordBasedRagRoutingPolicy.java   # デフォルト実装（キーワード + 業務番号）
└── service/
    └── AiAssistantService.java             # オーケストレーション・呼び出し・監査

src/main/resources/static/
├── index.html / embed.css / embed.js       # 統合デモページ
├── knowledge.html / knowledge.css / knowledge.js   # ナレッジ管理画面
├── assistant.css / assistant.js            # 組み込み型アシスタントコンポーネント
├── tokens.css                              # 共有デザイントークン、両テーマ対応
└── theme.js                                # テーマ切替
```

## HTTP API

| メソッド | パス | 説明 |
|---|---|---|
| `POST` | `/ai/chat` | 同期対話、`ChatReply` を返却 |
| `POST` | `/ai/chat/stream` | SSE ストリーミング対話、名前付きイベント `meta` / `delta` / `done` / `error` |
| `POST` | `/ai/knowledge` | 単体文書の登録（`content` + `metadata`） |
| `POST` | `/ai/knowledge/batch` | 一括登録（`List<String>`） |

### SSE プロトコル

```text
event: meta
data: {"conversationId":"c-...","route":"rag"}

event: delta
data: {"content":"ご質問の内容について、"}

event: done
data: {"durationMs":1834}

event: error
data: {"message":"..."}
```

`conversationId` を省略した場合、バックエンドが UUID を生成して `meta` イベントで返却します。フロントエンド側でキャッシュすることで複数ターンの対話に利用できます。

## フロントエンド入口

| URL | 説明 |
|---|---|
| `/` | 統合デモページ：ホスト mock + 組み込み型アシスタント + デモ操作バー（host / pose / theme） |
| `/knowledge.html` | ナレッジ管理画面：単体 / 一括登録、フィルター、ローカルビュー |

## 設定

リポジトリには安全に共有できる設定のみを含めています。

- `src/main/resources/application.yaml` — 環境変数プレースホルダーと安全なデフォルト値のみ
- `src/main/resources/application-local.example.yaml` — ローカル設定テンプレート
- `src/main/resources/application-local.yaml` — ローカル専用設定ファイル（Git では無視）

ローカル profile を有効にする：

```text
--spring.profiles.active=local
```

## 起動

前提条件：

- JDK 21
- 有効な DashScope API Key
- 接続可能な Qdrant インスタンス

```bash
mvn spring-boot:run -D"spring-boot.run.profiles=local"
```

デフォルトのエンドポイント：`http://localhost:8080`

## ロードマップ

完了：

- ✅ POST + DTO 化対話 API
- ✅ SSE ストリーミング応答（名前付きイベント）
- ✅ plain / RAG 二系統 ChatClient + 差し替え可能なルーティング戦略
- ✅ 組み込み型アシスタントコンポーネント（三状態 + 両テーマ）
- ✅ ナレッジ管理画面

進行中 / 計画中：

- 🚧 ツール呼び出し（`spring-ai-alibaba-agent-framework`、まずは通関の読み取り専用ツールから）
- 🚧 複数ターン対話のコンテキスト保存（`AssistantSession` ドメインモデル）
- 🚧 監査トレース（`AuditTrace`：モデル呼び出し、検索ヒット、ツール呼び出しの全リンク記録）
- 🚧 権限・リスクレベル（`ExecutionPolicy`：書き込み系操作はユーザー確認を要求）
- 🚧 バックエンドのナレッジ一覧 / 詳細 / 削除 API
- 🚧 アシスタントの Web Component 化
- 🚧 Prompt とツール登録の管理画面

## 作者

ZHANGCHAO
