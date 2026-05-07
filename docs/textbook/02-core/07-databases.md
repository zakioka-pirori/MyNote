# 第 12 章 データベース

## 学習目標

- リレーショナルモデル・関係代数・SQL を体系的に理解する。
- 正規化と非正規化のトレードオフを判断できる。
- インデックス・クエリプラン・トランザクション・ロック・MVCC を説明できる。
- NoSQL の各カテゴリ (KVS, ドキュメント, カラム, グラフ) と CAP 定理を理解する。

## 12.1 なぜ DB を学ぶか

データはアプリの本質であり、DB はそれを長期間・整合的に・高速に保管する仕組み。**N+1 クエリ、雑なインデックス、デッドロック、トランザクションの誤解** が現場の事故の大半を占める。RDBMS の理論は半世紀前に確立されているが、知らない人は今でも同じ罠に落ち続けている。

## 12.2 リレーショナルモデル

E.F. Codd が 1970 年に提唱。

- **関係 (relation)**: 属性を持つタプルの集合 ＝ 表 (table)。
- **属性 (attribute)**: 列。
- **タプル**: 行。
- **ドメイン**: 属性が取り得る値の集合。

### 制約

- 主キー (Primary Key): タプルを一意に識別。
- 外部キー (Foreign Key): 別の表の主キーを参照。
- NOT NULL, UNIQUE, CHECK。
- 参照整合性: 親が消えたら子をどうする (CASCADE, SET NULL, RESTRICT)。

## 12.3 関係代数

集合演算 + 関係特有の演算:
- 選択 $\sigma_{\text{条件}}$: 行を絞る (WHERE)。
- 射影 $\pi_{\text{属性}}$: 列を選ぶ (SELECT)。
- 直積 $\times$: 全組合せ (CROSS JOIN)。
- 結合 $\bowtie$: 条件付き直積。
- 和・差・共通。
- 商: 「すべての…を持つ」の表現。

SQL とほぼ等価な表現力を持ち、クエリの最適化変換の理論的基礎になる。

## 12.4 SQL

### DDL (Data Definition Language)

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### DML (Data Manipulation Language)

```sql
INSERT INTO users (email) VALUES ('a@b.com');
UPDATE users SET email = 'c@d.com' WHERE id = 1;
DELETE FROM users WHERE id = 1;
```

### クエリ

```sql
SELECT u.id, COUNT(o.id) AS num_orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id
HAVING COUNT(o.id) > 5
ORDER BY num_orders DESC
LIMIT 10;
```

#### 評価順序（論理）

1. FROM / JOIN
2. WHERE
3. GROUP BY
4. HAVING
5. SELECT
6. DISTINCT
7. ORDER BY
8. LIMIT / OFFSET

### サブクエリ・ウィンドウ関数・CTE

```sql
WITH ranked AS (
  SELECT id, salary,
         RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS r
  FROM employees
)
SELECT * FROM ranked WHERE r <= 3;
```

ウィンドウ関数（`ROW_NUMBER`, `LAG`, `LEAD`, `SUM() OVER`）は分析クエリで必須。

### NULL の扱い

3 値論理 (T/F/U)。`NULL = NULL` は UNKNOWN。`IS NULL`, `IS NOT NULL`, `COALESCE` を使う。

## 12.5 正規化

更新異常を防ぐためにスキーマを分解する。

- **第 1 正規形 (1NF)**: 属性は不可分（多値属性禁止）。
- **第 2 正規形 (2NF)**: 部分関数従属を排除。複合主キーの一部だけに従属する属性を分離。
- **第 3 正規形 (3NF)**: 推移関数従属を排除。
- **BCNF**: より強い 3NF。
- **4NF, 5NF**: 多値・結合従属。

実務では 3NF/BCNF を目標にしつつ、**性能・複雑さの理由で意図的に非正規化**することもよくある。集計用に重複を持つ、JSON 列で柔軟性を確保するなど。

## 12.6 物理設計とインデックス

### インデックス構造

- **B+ 木**: 範囲・等価検索とも $O(\log n)$。RDBMS の主要インデックス。
- **ハッシュ**: 等価のみ、$O(1)$ 平均。範囲不可。
- **全文 (GIN/GiST, inverted index)**: 部分文字列・自然言語検索。
- **ビットマップ**: カーディナリティの低い列、列指向 DB。
- **R 木**: 空間データ。

### インデックスの効き方

- 等価条件 `WHERE x = ?`、範囲 `WHERE x BETWEEN`、ソート、結合キーで効く。
- 関数を当てると効かない（`WHERE LOWER(email) = …` など）→ 関数インデックスで対処。
- 複合インデックスは「左から」効く。`(a, b)` は `WHERE a = ? AND b = ?` でも `WHERE a = ?` でも効くが、`WHERE b = ?` だけだと効かない。

### カバリングインデックス

クエリが必要な列をすべてインデックスに含めば、表本体を読まずに済む。

### 実行計画

`EXPLAIN ANALYZE` で実際の計画と時間を見る。
- Seq Scan / Index Scan / Index Only Scan / Bitmap Heap Scan。
- Nested Loop Join / Hash Join / Merge Join。
- 統計情報（`ANALYZE`）が古いとオプティマイザが誤る。

### 結合アルゴリズム

- Nested Loop Join: 小規模 × 内側にインデックス。
- Hash Join: 等価結合・大量データ向き。
- Sort-Merge Join: ソート済み結合キー。

## 12.7 トランザクション

### ACID

- **Atomicity**: 全部成功か全部失敗か。
- **Consistency**: 一貫性制約を保つ。
- **Isolation**: 並行実行が直列と同等の結果を出す。
- **Durability**: コミット後は障害でも消えない。

### 分離レベル

| レベル | ダーティリード | ノンリピータブルリード | ファントム |
|---|---|---|---|
| Read Uncommitted | あり | あり | あり |
| Read Committed | なし | あり | あり |
| Repeatable Read | なし | なし | あり (MySQL InnoDB は防ぐ) |
| Serializable | なし | なし | なし |

PostgreSQL のデフォルトは Read Committed、MySQL は Repeatable Read。

### 並行制御

- **2 相ロック (2PL)**: 取得相 + 解放相。直列化を保証。
- **MVCC**: 各トランザクションがスナップショットを見る。読み手は書き手をブロックしない。Postgres, Oracle, InnoDB で採用。
- **OCC (楽観的並行制御)**: 書き込み時に検証、衝突したらリトライ。

### デッドロック

リソース取得順を統一する、タイムアウトで検出。`SHOW ENGINE INNODB STATUS` で診断。

### 分散トランザクション

- 2 相コミット (2PC): 準備フェーズ + コミットフェーズ。ブロッキング。
- 3 相コミット (3PC)、Paxos Commit。
- サーガ: 補償トランザクションで分散の一貫性を緩く保つ。詳細は第 16 章。

## 12.8 障害復旧

- **WAL (Write-Ahead Log)**: 更新を先にログに記録、その後にデータページへ。クラッシュ時にログをリプレイ。
- **チェックポイント**: ログ量を抑えるために定期的にデータをディスクへフラッシュ。
- **ARIES**: REDO + UNDO + チェックポイントの古典的アルゴリズム。

## 12.9 NoSQL

スキーマ柔軟性、水平スケール、特殊用途を狙う。

### キー・バリュー (KVS)

Redis, Memcached, DynamoDB。$O(1)$ 平均。キャッシュ、セッション、キュー。

### ドキュメント

MongoDB, Couchbase。JSON ライク、スキーマレス。集約 (aggregation pipeline)。

### カラムファミリ

Cassandra, HBase, Bigtable。書き込みヘビーで時系列的なワークロードに強い。

### カラム指向 (列指向)

ClickHouse, BigQuery, Redshift, Parquet。集計クエリに強く、OLAP で主流。

### グラフ

Neo4j, Amazon Neptune。SNS、レコメンド、知識グラフ。Cypher / Gremlin で問合せ。

### 検索エンジン

Elasticsearch, OpenSearch。逆インデックス、全文検索、集計。

## 12.10 CAP と PACELC

**CAP 定理**: 分散 DB は Consistency / Availability / Partition Tolerance のうち 2 つしか同時に満たせない。実用ではネットワーク分断 (P) は前提なので、C と A のトレードオフ。

**PACELC**: 分断時 P があるとき C と A、それ以外でも遅延 (L) と整合性 (C) のトレードオフ。

例:
- CP: HBase, MongoDB (デフォルト), Spanner。
- AP: Cassandra, DynamoDB (eventual)。

## 12.11 OLTP と OLAP

- **OLTP**: トランザクション処理。短時間で多数の読み書き。RDBMS。
- **OLAP**: 解析処理。大量データを集計。列指向 DB、Data Warehouse。
- **HTAP**: 両立を狙う (TiDB, Spanner, SingleStore)。

ETL → ELT 化、データレイク（S3 + Parquet + Spark/Presto）が現代のデータ基盤。

## 12.12 性能チューニングの実践

1. **計測**: `EXPLAIN ANALYZE`、スロークエリログ。
2. **インデックス**: 検索条件・JOIN・ORDER BY を見て追加。
3. **クエリ書き換え**: サブクエリ→JOIN、CTE→インライン、無駄な `SELECT *` 排除。
4. **データモデル**: 正規化の見直し、サマリーテーブル、マテリアライズドビュー。
5. **設定**: バッファプール、shared_buffers、work_mem。
6. **物理**: パーティショニング、シャーディング、レプリケーション。

## 12.13 演習

1. 学生・科目・履修の 3 表で関係スキーマを設計し、3NF まで正規化せよ。
2. 上記から「2024 年に X 教授の科目を取った学生」を SQL で書け。
3. `users(id, name)` と `orders(id, user_id, amount)` で「注文額合計トップ 10 ユーザ」を取得し、適切なインデックスを提案せよ。
4. Read Committed 下でロストアップデートが起こる例を挙げ、`SELECT … FOR UPDATE` でどう防ぐか述べよ。
5. MVCC で「読み手が書き手をブロックしない」仕組みをスナップショットの観点で説明せよ。
6. CAP 定理の AP システムを採用すべきユースケース、CP を採用すべきユースケースを 1 つずつ挙げよ。
7. 列指向 DB が集計クエリで速い理由を、ストレージレイアウトと圧縮の観点で説明せよ。

## 12.14 まとめ

データベースは「データの永続化 + 整合性 + 性能」のバランスを精緻に設計するシステム。リレーショナルモデルと SQL、トランザクションと ACID、インデックスと実行計画、NoSQL と CAP――これらの基礎は 50 年前から変わらず、新製品の理解にもそのまま使える。**「インデックスが効くか」「実行計画はどう動くか」を脳内で再生できる**ようになると、性能問題の 9 割は事前に潰せる。

## 参考文献

- Garcia-Molina, Ullman, Widom, *Database Systems: The Complete Book* — 定番。
- Kleppmann, *Designing Data-Intensive Applications* — 現代の必読。
- Stonebraker & Hellerstein, *Readings in Database Systems* — 古典論文集。
- ミック『達人に学ぶ SQL 徹底指南書』。
- 『 SQL アンチパターン』。
- PostgreSQL, MySQL の公式ドキュメント。
