# xiaojieAI

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

xiaojieAI は、企業内業務システム向けの AI プラットフォーム試作プロジェクトです。Spring Boot、Spring AI、DashScope、Qdrant をベースに、通関、フォワーディング、およびその他の業務アプリケーションに統一されたアシスタント基盤を提供することを目的としています。

## 概要

- 統一された AI 会話入口
- 企業ナレッジを対象とした RAG ベースの質問応答
- 業務システム向けツール呼び出しと機能オーケストレーション
- フローティングアシスタント、サイドパネル、将来の音声入力に向けた共通バックエンド基盤

## 技術スタック

- Java 21
- Spring Boot 3.5.x
- Spring AI 1.1.x
- Spring AI Alibaba DashScope
- Qdrant Vector Store

## 現在の機能

- 基本的な AI チャット API
- ナレッジ文書の登録と一括投入
- ベクトル検索を利用した RAG パイプライン

## 設定

リポジトリには安全に共有できる設定のみを含めています。

- `src/main/resources/application.yaml`
  - 環境変数プレースホルダーと安全なデフォルト値のみ
- `src/main/resources/application-local.example.yaml`
  - ローカル設定テンプレート
- `src/main/resources/application-local.yaml`
  - ローカル専用設定ファイルであり、Git では無視されます

ローカル設定で起動する場合は `local` プロファイルを有効にしてください。

```text
--spring.profiles.active=local
```

## 起動

前提条件:

- JDK 21
- 有効な DashScope API Key
- 接続可能な Qdrant インスタンス

デフォルトのエンドポイント:

```text
http://localhost:8080
```

## 今後の方向

- 通関、受注、ワークフロー関連ツールの統合
- ホストシステムの画面遷移やフォーム入力を駆動する構造化 command の返却
- Web Component ベースのアシスタントウィジェット提供
- ストリーミング応答、監査トレース、権限制御の追加

## 作者

ZHANGCHAO
