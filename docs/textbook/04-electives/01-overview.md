# 第 20 章 選択トピック概観

## 学習目標

- 第 1〜3 層の上に立つ、より専門的・先端的な領域を一望する。
- 各トピックの要点・前提・代表的な参考文献を押さえ、興味のある方向に深く潜るための地図を得る。

## 20.1 自然言語処理 (NLP)

人間の言語を計算で扱う分野。

- 古典手法: 形態素解析, 構文解析, n-gram 言語モデル。
- 単語埋め込み: Word2Vec, GloVe, fastText。
- 系列モデル: RNN/LSTM, Seq2Seq + Attention。
- Transformer: BERT (理解), GPT (生成), T5 (両方)。
- タスク: 翻訳, 要約, 質問応答, 含意, 感情分析, 固有表現抽出, 対話。
- 評価: BLEU, ROUGE, BERTScore, 人手評価。
- 多言語と低リソース言語, トークナイザ (BPE, SentencePiece)。
- LLM 時代の課題: 幻覚, 安全性, 著作権, バイアス。

参考: Jurafsky & Martin *Speech and Language Processing*, Hugging Face Course。

## 20.2 コンピュータビジョン (CV)

画像・映像から意味を抽出。

- 古典: エッジ検出 (Canny), 特徴点 (SIFT, SURF, ORB), Hough 変換, ステレオ視。
- ディープラーニング: CNN, Vision Transformer (ViT), CLIP。
- タスク: 分類, 検出 (Faster R-CNN, YOLO, DETR), セグメンテーション (U-Net, Mask R-CNN, SAM)。
- 3D 再構成: SfM, MVS, NeRF, Gaussian Splatting。
- 動画: 行動認識, 物体追跡 (SORT, DeepSORT)。
- 自動運転, 医療画像, 衛星画像。

参考: Szeliski *Computer Vision: Algorithms and Applications*。

## 20.3 強化学習 (RL) 詳説

第 17 章で触れた RL を更に深く。

- マルコフ決定過程 (MDP), POMDP。
- 動的計画法 (価値反復, 方策反復)。
- モンテカルロ法, TD 学習。
- 関数近似と深層 RL: DQN, Double DQN, Dueling, Rainbow。
- 方策勾配: REINFORCE, A2C/A3C, PPO, TRPO, SAC。
- モデルベース: PETS, MuZero, World Models。
- 模倣学習, オフライン RL, RLHF。
- 探索: Curiosity, RND, NoisyNet。
- 応用: ロボティクス, ゲーム, 推薦, LLM のアライメント。

参考: Sutton & Barto, OpenAI Spinning Up, *Deep RL Bootcamp*。

## 20.4 形式手法とプログラム検証

ソフトウェアの正しさを **数学的に** 保証する手法群。

- モデル検査 (SPIN, NuSMV, TLA+ TLC)。
- 定理証明支援系: Coq, Isabelle, Lean 4, Agda。
- 抽象解釈 (Astrée が Airbus で実用)。
- シンボリック実行, KLEE。
- Hoare 論理, Separation Logic, Iris。
- 型理論 (依存型) と Curry-Howard。
- 産業応用: コンパイラ検証 (CompCert), seL4 マイクロカーネル, 金融契約検証。

参考: Pierce *Software Foundations*, Lamport *Specifying Systems*。

## 20.5 並列計算と HPC

- 共有メモリ並列: OpenMP, Intel TBB。
- 分散メモリ: MPI。
- データ並列: SIMD, GPU (CUDA, ROCm)。
- スケジューリング, ロードバランス。
- ベンチマーク: Linpack, HPCG, MLPerf。
- スーパーコンピュータ「富岳」, Frontier。
- 数値計算ライブラリ: BLAS, LAPACK, FFTW, PETSc。

参考: Pacheco *An Introduction to Parallel Programming*。

## 20.6 量子計算

古典計算と異なる原理で計算する。

- 量子ビット (qubit), 重ね合わせ, もつれ, 測定。
- 量子ゲート (Hadamard, CNOT, T)。
- 量子回路モデル, 量子アルゴリズム:
  - Deutsch-Jozsa, Bernstein-Vazirani。
  - Grover (探索を $O(\sqrt n)$)。
  - Shor (素因数分解を多項式時間, RSA 破壊)。
  - QAOA, VQE (最適化, 量子化学)。
- 量子誤り訂正 (Surface code)。
- 量子優位性 (Quantum Supremacy) と現実: NISQ 時代。
- ポスト量子暗号: 格子, 符号, 多変数多項式, ハッシュ。

参考: Nielsen & Chuang *Quantum Computation and Quantum Information*。

## 20.7 暗号理論（高度）

第 15 章を超える理論的なトピック。

- ゼロ知識証明 (zk-SNARK, zk-STARK): プライバシ保護, ブロックチェーン。
- 準同型暗号 (FHE): 暗号文のまま計算。Microsoft SEAL, OpenFHE。
- マルチパーティ計算 (MPC)。
- 楕円曲線ペアリング (BLS 署名)。
- 格子ベース暗号 (CRYSTALS-Kyber, Dilithium): NIST PQC 標準化。
- 差分プライバシ。

参考: Boneh & Shoup *A Graduate Course in Applied Cryptography* (無料)。

## 20.8 ブロックチェーンと分散台帳

- ハッシュチェーン, マークル木。
- コンセンサス: PoW (Bitcoin), PoS (Ethereum 2), PBFT。
- スマートコントラクト (EVM, Solidity)。
- L2: Rollup (Optimistic, ZK), Plasma, State Channel。
- 暗号資産・DeFi・NFT・ステーブルコイン。
- 規制とコンプライアンス。

参考: Antonopoulos *Mastering Bitcoin* / *Mastering Ethereum*。

## 20.9 バイオインフォマティクス

- ゲノム配列のアライメント (Smith-Waterman, BWT, BWA, Bowtie)。
- アセンブリ (de Bruijn graph)。
- 配列比較・系統樹。
- タンパク質構造予測: AlphaFold 2/3 が AI で革命。
- バイオデータベース, ワークフロー (Nextflow, Snakemake)。

参考: Durbin et al. *Biological Sequence Analysis*。

## 20.10 組込み・リアルタイムシステム

- 8 / 16 / 32 ビット MCU (AVR, STM32, ESP32, ARM Cortex-M)。
- リアルタイム OS: FreeRTOS, Zephyr, VxWorks。
- ハード/ソフトリアルタイム, EDF, Rate Monotonic。
- AUTOSAR (車載), DO-178C (航空)。
- 省電力設計, 通信プロトコル (CAN, LIN, FlexRay, ModBus)。
- IoT: MQTT, CoAP, LoRa, NB-IoT。

参考: Kopetz *Real-Time Systems*, Yiu *The Definitive Guide to ARM Cortex-M*。

## 20.11 ロボティクス

- 運動学 (順 / 逆), 動力学。
- 経路計画 (A*, RRT, PRM, Lattice)。
- SLAM (EKF-SLAM, Graph SLAM, LiDAR SLAM, Visual SLAM)。
- センサ融合 (Kalman フィルタ, パーティクルフィルタ)。
- 制御 (PID, LQR, MPC)。
- ROS / ROS 2。
- 学習ベースロボティクス, Sim2Real。

参考: Siegwart *Introduction to Autonomous Mobile Robots*, *Probabilistic Robotics*。

## 20.12 ゲーム開発

- ゲームエンジン: Unity, Unreal, Godot。
- ゲームループ (固定ステップ, 可変ステップ)。
- ECS (Entity-Component-System)。
- 物理エンジン (PhysX, Bullet, Box2D)。
- AI (FSM, Behavior Tree, GOAP, MCTS)。
- マルチプレイヤー (rollback, lockstep, lag compensation)。
- ローカライズ, アクセシビリティ。

参考: Gregory *Game Engine Architecture*, *Game Programming Patterns*。

## 20.13 ヒューマノイド・自律システム・自動運転

- 認知 → 知覚 → 決定 → 制御。
- E2E 学習 vs モジュラ。
- 安全性論証 (ISO 26262, SOTIF)。
- シミュレーション (CARLA, NVIDIA Drive Sim)。

## 20.14 データ工学・データ基盤

- データレイク, データウェアハウス, レイクハウス。
- ETL/ELT (Airflow, dbt)。
- バッチ vs ストリーミング (Spark, Flink)。
- メタデータ管理 (DataHub, Amundsen)。
- データ品質, リネージュ, ガバナンス。

参考: Reis & Housley *Fundamentals of Data Engineering*。

## 20.15 倫理・社会・政策

CS は社会と切り離せない。

- アルゴリズム公平性, 差別の自動化。
- AI ガバナンス (EU AI Act, NIST RMF)。
- プライバシ (GDPR, 個人情報保護法, 各州法)。
- オープンソースのライセンス。
- 持続可能性 (Green Software, データセンタ電力)。
- アクセシビリティ法令。
- 戦争・監視・労働への影響。

技術者として「**何を作るか・作らないか**」を判断する倫理感覚は、技術力と同等に重要。

## 20.16 学び続けるために

- 学術誌・カンファレンス: SOSP, OSDI, SIGMOD, VLDB, NeurIPS, CVPR, ACL, POPL, S&P, USENIX Security。
- arXiv で最新論文を追う。
- オープンソースを読む / 貢献する。
- 自作プロジェクト: 「自作 OS」「自作 DB」「自作言語」「自作 NN フレームワーク」 ……コアを 1 つ書くと多分野が一気に深まる。
- 読書会, 勉強会, 学会発表。
- 教えることが最強の学習。

## 20.17 まとめ

第 4 層は無限に広がる森。本書の他の章で身につけた基礎があれば, どの専門に潜っても土台が崩れることはない。**興味駆動で深掘りする** こと, 一方で **基礎へ戻ってくる** ことを繰り返すと, 専門と全体観が両立する。CS は単なる技術の集合ではなく, 知識の構造化と継続的な学習の文化そのもの。本書の旅を終えたあなたは, もはや「文系卒」ではなく, 立派な CS 専攻卒の知識体系を持つエンジニアである。これからは自分で道を選び, さらに先へ進んでほしい。

## 参考文献（汎用）

- ACM Computing Curricula (CS2023): カリキュラムの国際標準。
- Open Source Society University (GitHub): 無料の自習カリキュラム。
- Teach Yourself Computer Science。
- 名門大学の公開講座: MIT OCW, Stanford CS, CMU, Berkeley。
- *Communications of the ACM* — 月刊で分野横断の動向。

## 締めくくり

本書はあなたのコンピュータサイエンスの旅の **地図** に過ぎない。地図は領土ではない。実際にコードを書き, 証明を追い, 論文を読み, 設計を議論することで, 知識は身体化する。「**わからない」を放置しない**, 「**簡単に見えても深掘りする**」, 「**理論と実装の両輪を回す**」――この 3 つだけは, どんな分野でも変わらない学びの技法である。

幸運を祈る。
