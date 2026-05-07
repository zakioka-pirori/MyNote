# MyNote — コンピュータサイエンス自習教科書

文系卒・現役エンジニアが、コンピュータサイエンス専攻の大学生が学ぶ内容を自習するための教科書。
**この教科書をすべて読み終えると、CS 学部卒業生と同等の知識体系が手に入る** ことを目指して構成されている。

## 読み方

| 環境 | URL / 場所 |
|---|---|
| **Web (PC・スマホ)** | <https://zakioka-pirori.github.io/MyNote/> |
| **GitHub 上で読む** | [`docs/`](./docs/) ディレクトリ |
| **ローカル** | `pip install -r requirements.txt && mkdocs serve` |

Web 版は MkDocs Material で組まれており、検索・ダークモード・数式レンダリング・スマホ最適化レイアウトに対応している。

## カリキュラム構成（4 層）

1. [**第 1 層 数学・論理基礎**](docs/textbook/01-foundations/) — 離散数学 / 線形代数 / 微積分 / 確率統計 / 論理
2. [**第 2 層 コア科目**](docs/textbook/02-core/) — プログラミング言語 / アルゴリズム / 計算理論 / アーキテクチャ / OS / ネットワーク / DB / コンパイラ / ソフトウェア工学
3. [**第 3 層 応用・発展**](docs/textbook/03-applied/) — セキュリティ / 分散システム / AI・機械学習 / HCI / グラフィックス
4. [**第 4 層 選択・先端**](docs/textbook/04-electives/) — NLP / CV / 強化学習 / 形式手法 / HPC / 量子計算 など

詳細なロードマップは [`docs/cs-curriculum.md`](./docs/cs-curriculum.md)、教科書全体の入口は [`docs/index.md`](./docs/index.md)。

## GitHub Pages 初回セットアップ

リポジトリオーナーが 1 度だけ実施する:

1. **Settings → Pages** を開く
2. **Source** を「**GitHub Actions**」に設定する
3. `main` にマージするか、Actions タブから `Deploy MkDocs site` を手動実行すると初回デプロイが走る

以降は `main` への push 毎に自動再デプロイされる。
