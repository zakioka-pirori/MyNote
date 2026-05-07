# 第 6 章 プログラミング言語パラダイム

## 学習目標

- 手続き型・オブジェクト指向・関数型・論理型・並行という主要パラダイムを使い分けられるようになる。
- 「言語に依存しない」概念（束縛・スコープ・型・評価戦略）を獲得する。
- C・Java・Python・Haskell・Lisp などを横断的に触り、適材適所の判断ができるようになる。

## 6.1 なぜ複数のパラダイムを学ぶか

プログラミング言語は「考え方の枠組み」を提供する。同じ問題でも、手続き的に書くか、オブジェクト指向で書くか、関数型で書くかで設計の見え方が変わる。**1 言語しか知らないと、その言語の制約が思考の限界になる**。複数パラダイムを横断することで、同じ問題に対する複数の解像度を持てるようになる。

## 6.2 言語横断の基本概念

### 束縛とスコープ

- **束縛 (binding)**: 名前を値に結びつけること。
- **スコープ (scope)**: 名前の有効範囲。レキシカル（静的）スコープが現代の主流。動的スコープは Bash や Emacs Lisp に名残。
- **クロージャ (closure)**: 関数 + 自由変数の束縛環境。JavaScript の `function`、Python の `lambda`、Lisp の `lambda` で同じ概念。

### 評価戦略

- **値呼び (call by value)**: 引数を評価してから渡す（C, Java の基本型）。
- **参照呼び (call by reference)**: 変数自体を渡す（C++ の参照、Pascal の var）。
- **共有呼び (call by sharing)**: オブジェクト参照のコピーを渡す（Python, Java のオブジェクト）。
- **必要呼び (call by need)**: 必要になったとき初めて評価（Haskell の遅延評価）。

### 型システム

- 静的 vs 動的: コンパイル時に型を決めるか、実行時に決めるか。
- 強い vs 弱い: 暗黙の型変換をどれだけ許すか。
- 型推論: Hindley-Milner（OCaml, Haskell）、局所推論（Java, C#）。
- 多相: パラメトリック多相（ジェネリクス）、サブタイプ多相、アドホック多相（型クラス、オーバーロード）。

### メモリモデル

- スタック vs ヒープ
- 値型 vs 参照型
- 所有権・借用（Rust）
- ガベージコレクション（Java, Go, Python）

## 6.3 手続き型プログラミング (C)

C は「ハードウェアに近い」抽象化。

```c
int sum(int *arr, int n) {
    int s = 0;
    for (int i = 0; i < n; i++) s += arr[i];
    return s;
}
```

要点:
- ポインタと配列の関係（`a[i]` は `*(a + i)`）。
- 構造体とビットフィールド。
- マニュアルメモリ管理（`malloc` / `free`）。
- ヘッダファイルと分割コンパイル。
- プリプロセッサ。

C を学ぶと、後の章（コンピュータアーキテクチャ・OS・ネットワーク）の議論が物理的な裏付けを持つ。**ポインタとメモリレイアウトが理解できれば C は卒業**。

## 6.4 オブジェクト指向プログラミング (OOP)

中心概念:
- **カプセル化**: 状態と振る舞いを 1 つの単位（クラス）にまとめ、内部を隠蔽する。
- **継承**: 既存クラスを拡張する。
- **多態性**: 同じインターフェースに複数の実装を許す。

### クラスベース vs プロトタイプベース

- クラスベース: Java, C++, Python, Ruby
- プロトタイプベース: JavaScript, Self, Lua（オブジェクトを直接拡張）

### SOLID 原則

- **S**ingle Responsibility: 1 クラスに 1 責務。
- **O**pen/Closed: 拡張に開き、変更に閉じる。
- **L**iskov Substitution: 派生型は基底型の代わりに使えること。
- **I**nterface Segregation: 太すぎるインターフェースを避ける。
- **D**ependency Inversion: 抽象に依存し、具象に依存しない。

### 継承 vs コンポジション

「継承より合成を選べ (Composition over Inheritance)」が現代の格言。深い継承階層は脆い。

### 例 (Java)

```java
abstract class Shape {
    abstract double area();
}
class Circle extends Shape {
    double r;
    Circle(double r) { this.r = r; }
    double area() { return Math.PI * r * r; }
}
class Square extends Shape {
    double s;
    Square(double s) { this.s = s; }
    double area() { return s * s; }
}
```

## 6.5 関数型プログラミング

関数を **第一級** に扱い、副作用を最小化する。

中心概念:
- **純粋関数**: 入力が同じなら出力が同じ、副作用なし。
- **不変データ**: 既存値を変えず新しい値を作る。
- **高階関数**: 関数を引数にとる/返す（`map`, `filter`, `reduce`）。
- **再帰**: ループの代わり。末尾再帰最適化で効率化。
- **代数的データ型 (ADT)**: 直積（タプル・レコード）と直和（バリアント）。
- **パターンマッチ**: ADT の分解。

### 例 (Haskell)

```haskell
data Tree a = Leaf | Node (Tree a) a (Tree a)

insert :: Ord a => a -> Tree a -> Tree a
insert x Leaf = Node Leaf x Leaf
insert x (Node l v r)
  | x < v     = Node (insert x l) v r
  | x > v     = Node l v (insert x r)
  | otherwise = Node l v r
```

### モナド

副作用（IO・状態・例外・非決定性）を型で扱う仕組み。`>>=` 演算子で連鎖する。Haskell の IO、Scala の Future、JavaScript の Promise はすべてモナドの近縁。

### 関数型の応用

- React の状態管理（Redux、純粋関数の reducer）
- Spark / MapReduce（並列の高階関数）
- 型安全なエラー処理（Result, Option）
- 不変データ構造（永続データ構造）

## 6.6 論理型プログラミング (Prolog)

「事実」と「規則」を宣言し、「クエリ」で推論する。

```prolog
parent(alice, bob).
parent(bob, charlie).
ancestor(X, Y) :- parent(X, Y).
ancestor(X, Y) :- parent(X, Z), ancestor(Z, Y).

?- ancestor(alice, charlie).  % true
```

ユニフィケーションとバックトラックで「与えられた条件を満たす変数の値」を探索する。エキスパートシステム、自然言語処理、計画問題に応用。

## 6.7 並行・並列プログラミング

- **並行 (concurrent)**: 複数のタスクを論理的に同時に進める。
- **並列 (parallel)**: 物理的に同時実行。

### モデル

- **共有メモリ + ロック**: 古典的だが難しい（デッドロック、レース）。
- **アクター (Erlang, Akka)**: メッセージパッシング、状態は各アクター内に閉じる。
- **CSP / Go チャネル**: チャネル経由の通信。
- **STM (Software Transactional Memory)**: トランザクションでメモリ操作。
- **データ並列 (CUDA, OpenMP)**: 同じ操作を多数のデータに。

詳細は第 10 章（OS）と第 16 章（分散システム）で扱う。

## 6.8 動的言語 (Python, Ruby, JavaScript)

- ダックタイピング: 型ではなく振る舞いで判定。
- REPL 駆動開発。
- メタプログラミング（リフレクション、デコレータ）。
- 動的型ゆえの柔軟性と、型ヒント (Python の typing, TypeScript) による静的検査の混合が現代の主流。

## 6.9 言語処理系の入口

すべての言語は「字句解析 → 構文解析 → 意味解析 → 中間表現 → 最適化 → コード生成」を経て実行される。詳細は第 13 章で扱う。

ここでは「同じプログラムが処理系によって違う性能・違う意味を持ちうる」という認識を持つ:
- C のコンパイル + リンク
- Java のバイトコード + JVM
- Python のバイトコード + インタプリタ
- JavaScript の JIT
- Haskell の GHC（型付き）

## 6.10 ドメイン特化言語 (DSL)

汎用言語 (GPL) 上に薄く乗せた言語。SQL, regex, HTML, CSS, GraphQL, Dockerfile などすべて DSL。Lisp のマクロや Ruby のブロック、Scala の implicit を使って自作することもできる。

## 6.11 学び方の実践指針

1. C で配列・ポインタ・構造体・malloc を使った小プログラム。
2. Java または Python で OOP の小プロジェクト（クラス階層を伴うシミュレーション）。
3. Haskell または OCaml で型付き関数型プログラム（簡単なインタプリタを作るのが王道）。
4. JavaScript (TypeScript) で動的言語と非同期。
5. Rust で所有権モデル（モダンシステムプログラミング）。
6. Prolog で論理プログラミング 1 週間。

各言語で **同じ問題（例: ToDo CLI）を実装し直す** と、パラダイムの違いが体感できる。

## 6.12 演習

1. C で `qsort` を呼び出さず、自前のクイックソートを実装せよ。
2. Java でストラテジーパターンを使ってソート手法を切替可能なクラスを設計せよ。
3. Haskell で二分木を表す ADT を定義し、`map`、`fold`、`size` を書け。
4. JavaScript の `var`、`let`、`const` のスコープと巻き上げの違いを実験で確認せよ。
5. Python のデコレータで関数の実行時間を測る `@timeit` を実装せよ。
6. Prolog で家系図を表現し、いとこ関係を定義せよ。
7. Rust で借用チェッカに引っかかるコードと、それを直したコードのペアを示せ。

## 6.13 まとめ

パラダイムは「世界の切り取り方」であり、それぞれが特定の問題ドメインに適する。C は機械寄り、Java/C# は大規模 OO、Python/JS は素早い試作、Haskell/OCaml は安全性、Erlang/Go は並行、Prolog は推論、Rust は安全 + システム。本章で身につけた概念――束縛・スコープ・型・評価戦略・副作用――は、次章以降のあらゆる議論で前提となる。

## 参考文献

- Sebesta, *Concepts of Programming Languages* — パラダイム横断の定番。
- Pierce, *Types and Programming Languages* — 型理論の本格教科書。
- Friedman & Wand, *Essentials of Programming Languages* — インタプリタを書きながら学ぶ。
- Bryant & O'Hallaron, *Computer Systems: A Programmer's Perspective* — C と低レイヤ。
- 『プログラミング言語の基礎概念』五十嵐淳 — 日本語で型と意味論。
