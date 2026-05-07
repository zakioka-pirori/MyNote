# 第 14 章 ソフトウェア工学

## 学習目標

- ソフトウェアを「書く」だけでなく「保守し続けられる形にする」技術を学ぶ。
- 設計原則・パターン・テスト・バージョン管理・CI/CD・運用という一連のライフサイクルを理解する。
- 規模が大きくなっても破綻しないコードベースの作り方を身につける。

## 14.1 なぜソフトウェア工学か

「動くコード」と「**1 年後の自分や他人がいじっても破綻しないコード**」は別物。後者を作る技術がソフトウェア工学。アルゴリズムや型は要素技術だが、ソフトウェア工学は「人がたくさん関わる」「時間が長い」「要求が変化する」という現実に立ち向かう統合的な営みである。

## 14.2 ライフサイクルモデル

### ウォーターフォール

要求 → 設計 → 実装 → テスト → 運用 を順に。要求が固まる場合に有効、変化に弱い。

### アジャイル

短いイテレーションで動くものを作りフィードバックする。スクラム、XP、カンバン。
- スクラム: スプリント、プロダクトバックログ、レトロスペクティブ。
- XP: TDD, ペアプログラミング, 継続的インテグレーション。
- カンバン: WIP 制限、フロー最適化。

### DevOps / SRE

開発と運用を統合。CI/CD、IaC、観測性、ポストモーテム文化。Google の SRE 本が古典。

## 14.3 要求と仕様

- 機能要求 vs 非機能要求（性能、可用性、セキュリティ、保守性）。
- ユーザストーリー (As a … I want … so that …)。
- ユースケース、シナリオ。
- 形式仕様 (TLA+, Alloy)。

「**何を作らないか**」を決めるのが要求工学の最大の役割。

## 14.4 設計原則

### モジュール化

- 凝集度 (cohesion): 1 モジュール内の要素が密に関連しているか。**高凝集が良い**。
- 結合度 (coupling): モジュール間の依存度。**疎結合が良い**。

### SOLID

- **S**ingle Responsibility: 1 クラス 1 責務。
- **O**pen/Closed: 拡張に開き、変更に閉じる。
- **L**iskov Substitution: 派生型は基底型と置換可能。
- **I**nterface Segregation: 太いインターフェースを分割。
- **D**ependency Inversion: 抽象に依存、具象に依存しない。

### DRY / YAGNI / KISS

- DRY (Don't Repeat Yourself)。
- YAGNI (You Aren't Gonna Need It): 仮定の未来要件を入れない。
- KISS (Keep It Simple, Stupid)。

「**3 度目で抽象化** (Rule of Three)」は早すぎる抽象化を避ける格言。

## 14.5 デザインパターン (GoF)

### 生成系

- Singleton, Factory Method, Abstract Factory, Builder, Prototype。

### 構造系

- Adapter, Decorator, Facade, Proxy, Composite, Bridge, Flyweight。

### 振る舞い系

- Strategy, Observer, Iterator, Visitor, Command, State, Template Method, Chain of Responsibility, Mediator, Memento, Interpreter。

### アーキテクチャパターン

- MVC / MVP / MVVM。
- Layered Architecture。
- Hexagonal (Ports and Adapters)。
- Clean Architecture。
- Event-Driven, CQRS, Event Sourcing。
- Microservices vs Monolith。

パターンは「共通言語」。意思疎通の道具として使うのが本質で、強引に当てはめないこと。

## 14.6 ドメイン駆動設計 (DDD)

複雑業務領域でのソフトウェア設計手法。

- ユビキタス言語: ビジネスとコードで同じ語彙。
- 境界づけられたコンテキスト (Bounded Context)。
- エンティティ, 値オブジェクト, ドメインサービス, リポジトリ, アグリゲート。
- 戦略的設計 vs 戦術的設計。

## 14.7 リファクタリング

「外部の振る舞いを変えずに内部構造を改善する」。Fowler の同名書がバイブル。

- メソッド抽出、インライン化。
- 変数のリネーム、フィールド移動。
- クラス抽出、継承からコンポジションへ。
- データクラスへのカプセル化。

スメル（コードの臭い）: 重複、長い関数、巨大クラス、機能の横恋慕、シャットガン手術。

## 14.8 テスト

### テストの種類

- **単体テスト (Unit)**: 1 クラス/関数。
- **統合テスト (Integration)**: 複数モジュール、DB との結合。
- **E2E テスト**: ユーザ体験を再現。
- **受け入れテスト (Acceptance)**。
- **回帰テスト**: 既存機能が壊れていないか。
- **パフォーマンステスト**: 負荷, スパイク, 持続。
- **セキュリティテスト**: ペネトレ, ファジング。

### テストピラミッド

土台に多数の高速な単体、上に少数の遅い E2E。逆ピラミッドはアンチパターン。

### TDD (Test-Driven Development)

1. Red: 失敗するテストを書く。
2. Green: 最低限通す実装。
3. Refactor: 設計を整える。

「テストが設計を導く」点が本質。

### モック・スタブ・フェイク

外部依存（DB, ネットワーク）を差し替える。**Test Double**。やりすぎは脆いテストの原因。

### プロパティベーステスト

入力をランダム生成して性質を検証 (QuickCheck, Hypothesis)。例: ソートは結果が単調増加 + 元の集合と等しい。

### カバレッジ

行・分岐・関数・条件・MCDC。100% を目標にしないこと（テストの質はカバレッジで測れない）。

### ミューテーションテスト

意図的にコードを改変してテストが捕えるか測る。テストの質を評価する強力な手法。

## 14.9 バージョン管理 (Git)

### モデル

スナップショット + 有向非巡回グラフ。
- コミット, ツリー, ブロブ。
- ブランチはコミットへのポインタ。
- マージ vs リベース。

### ワークフロー

- Git Flow, GitHub Flow, Trunk-Based Development。
- フィーチャーブランチ, リリースブランチ。

### 良いコミット

- 1 コミット 1 変更（atomic）。
- 件名 50 文字、本文 72 文字折り返し。
- 「なぜ」を書く。

### コードレビュー

- 小さく、頻繁に。
- 自動チェック (lint, test) は機械に任せる。
- 人は設計・命名・意図に集中。
- 心理的安全性とポジティブ言語。

## 14.10 CI/CD

### CI (Continuous Integration)

push のたびにビルド・テスト。GitHub Actions, GitLab CI, Jenkins, CircleCI。

### CD (Continuous Delivery / Deployment)

メインブランチがいつでも本番に出せる状態を保つ。デプロイは自動化。
- Blue/Green, Canary, Rolling。
- フィーチャーフラグで「リリース」と「機能公開」を分離。

### IaC (Infrastructure as Code)

Terraform, Pulumi, AWS CloudFormation。インフラもコードで管理し PR でレビュー。

## 14.11 観測性 (Observability)

3 本柱: ログ, メトリクス, トレース。

- 構造化ログ (JSON)。
- メトリクス (Prometheus, Grafana)。RED (Rate, Errors, Duration), USE (Utilization, Saturation, Errors)。
- 分散トレーシング (OpenTelemetry)。

SLI / SLO / SLA、エラーバジェット。

## 14.12 ドキュメント

- README: 1 分でわかる導入。
- ADR (Architecture Decision Record): 「なぜこの設計を選んだか」を記録。
- 設計ドキュメント (Design Doc): 大規模変更前に書く。
- API ドキュメント (OpenAPI, GraphQL Schema)。
- ランブック: 障害対応手順。

「**コードは How を語り、ドキュメントは Why を語る**」。

## 14.13 セキュアな開発

- 脅威モデリング (STRIDE)。
- セキュアコーディング (OWASP)。
- 依存パッケージのスキャン (Dependabot, Snyk)。
- シークレット管理 (Vault, AWS Secrets Manager)。
- 詳細は第 15 章。

## 14.14 性能と保守性のメトリクス

- 循環的複雑度 (McCabe)。
- 変更の局所性 (Coupling Metrics)。
- DORA 4 メトリクス: デプロイ頻度, リードタイム, MTTR, 変更失敗率。

## 14.15 チームと文化

- ペア・モブ・コードレビュー。
- ノックトーキング (Knock-knock コミュニケーション)。
- ポストモーテム (非難なし)。
- オンコール文化。

技術スキルだけでなく、**書く・聞く・対話する** がエンジニアの中核能力。

## 14.16 演習

1. 「機能 X を Strategy パターンで実装する」「同じ機能を継承で実装する」を比較し、メリット・デメリットを表でまとめよ。
2. 関数 `add(a, b)` の TDD サイクルを Red→Green→Refactor で書け（テストフレームワーク任意）。
3. 任意のオープンソースリポジトリで PR を 1 件レビューし、観点（設計・命名・テスト・性能）ごとにコメントせよ。
4. ある機能の ADR を 1 ページ書け（背景・選択肢・採用案・トレードオフ）。
5. ピラミッドの形になっていないテストスイートの問題点を 3 つ挙げよ。
6. Git で「3 つのコミットを 1 つに整理」する手順を `rebase -i` で記述せよ。
7. SLO「月 99.9% の可用性」のエラーバジェットを分単位で計算せよ。

## 14.17 まとめ

ソフトウェア工学は「複雑さと変化に耐えるコードベース」を作る技術。原則 (SOLID, DRY)、パターン (GoF, アーキテクチャ)、テスト (ピラミッド, TDD)、Git とコードレビュー、CI/CD、観測性。これらは派手ではないが、長期に渡る生産性と安全性を支える土台になる。「自分が 1 年後にこのコードを触るとき、頭が爆発しないか」を毎日問い続けることが、エンジニアの卒業条件である。

## 参考文献

- Beck, *Test-Driven Development: By Example*。
- Fowler, *Refactoring* / *Patterns of Enterprise Application Architecture*。
- GoF, *Design Patterns*。
- Evans, *Domain-Driven Design*。
- Hunt & Thomas, *The Pragmatic Programmer*。
- Brooks, *The Mythical Man-Month*。
- Google, *Software Engineering at Google* / *Site Reliability Engineering*。
- Martin, *Clean Code* / *Clean Architecture*。
- 『プリンシプル・オブ・プログラミング』。
