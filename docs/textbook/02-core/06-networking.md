# 第 11 章 コンピュータネットワーク

## 学習目標

- ネットワークが「物理層から HTTP まで階層化された設計」になっている理由を理解する。
- IP, TCP, UDP, DNS, HTTP/HTTPS の仕組みを説明し、トラブルシュートできるようになる。
- TLS, ロードバランサ, CDN, NAT などモダンな構成要素を体系的に把握する。
- ソケット API でクライアント/サーバを実装できる。

## 11.1 なぜネットワークか

Web サービス、API、リアルタイム通信、分散システム、IoT――現代のソフトウェアはほぼすべて通信を伴う。「`curl` が遅い」「タイムアウトする」「TLS ハンドシェイクが失敗する」を診断できるエンジニアは、フルスタックでの問題解決力が桁違いに高い。

## 11.2 階層化と参照モデル

### OSI 参照モデル（7 層）

1. 物理層: 信号の電気・光・電波。
2. データリンク層: フレーム、Ethernet、MAC。
3. ネットワーク層: パケット、IP、ルーティング。
4. トランスポート層: セグメント、TCP/UDP。
5. セッション層: 会話の管理。
6. プレゼンテーション層: 文字コード・暗号化。
7. アプリケーション層: HTTP, SMTP, DNS。

### TCP/IP モデル（実用 4 層）

1. リンク層 ＝ OSI 1+2
2. インターネット層 ＝ OSI 3
3. トランスポート層 ＝ OSI 4
4. アプリケーション層 ＝ OSI 5+6+7

階層化により、各層は下層を抽象化された配管として扱える。HTTP を書くプログラマは TCP の輻輳制御を意識せずに済む。

## 11.3 物理層・データリンク層

- 媒体: 銅線・光ファイバ・無線。
- 符号化: Manchester, NRZ, 4B/5B。
- フレーミング: 開始/終了マーカで境界を区切る。
- 誤り検出/訂正: CRC, ハミング符号。
- 媒体アクセス制御 (MAC): CSMA/CD (Ethernet), CSMA/CA (Wi-Fi)。
- スイッチ: MAC アドレスで学習し転送。
- VLAN: 仮想 LAN。

Ethernet フレーム構造: 宛先 MAC, 送信元 MAC, タイプ, ペイロード, FCS。

ARP: IP → MAC アドレス解決。同一サブネット内でブロードキャスト。

## 11.4 ネットワーク層 (IP)

### IPv4

32 ビットアドレス。`192.168.1.1` 形式。

- クラス（A/B/C）→ CIDR (`/24`) へ移行。
- サブネット: ネットワーク部 + ホスト部。マスクで区分。
- 私有アドレス: 10/8, 172.16/12, 192.168/16。
- NAT: 私有 ↔ グローバル変換。IPv4 アドレス枯渇への応急処置。

### IPv6

128 ビット。`2001:db8::1`。アドレス枯渇を解消、IPsec 標準、自動構成。普及進行中。

### ルーティング

- ルーティングテーブル: 宛先プレフィックス → 次ホップ。
- 静的 vs 動的。
- 内部: OSPF (リンクステート), RIP (距離ベクトル)。
- 外部: BGP (経路ベクトル, ポリシ重視)。インターネットの背骨。
- Longest Prefix Match: 最長プレフィックスを採用。

### IP パケット

ヘッダ: バージョン, TTL, プロトコル, 送信元/宛先 IP, チェックサム。フラグメンテーションは IPv6 では端点が責任。

### ICMP

`ping`, `traceroute` の正体。エラー通知（unreachable, TTL 超過）。

## 11.5 トランスポート層

### UDP

コネクションレス、信頼性なし、軽量。DNS, DHCP, リアルタイム動画/音声、QUIC のベース。

### TCP

コネクション指向、信頼性あり、順序保証、輻輳制御。

3 ウェイハンドシェイク:
```
Client          Server
  | SYN, seq=x   |
  |------------->|
  | SYN+ACK,     |
  |   seq=y, ack=x+1
  |<-------------|
  | ACK, ack=y+1 |
  |------------->|
```

4 ウェイ FIN クローズ。

### 信頼性メカニズム

- シーケンス番号と ACK。
- 再送 (RTO, fast retransmit)。
- ウィンドウ制御（送信ウィンドウ、受信ウィンドウ）。
- フロー制御: 受信側のバッファが溢れないように。
- 輻輳制御: ネットワーク帯域を超えないように。
  - スロースタート、輻輳回避、Fast Retransmit/Recovery。
  - アルゴリズム: Reno, Cubic, BBR。

### ポート

0–65535。Well-known: 22 (SSH), 25 (SMTP), 53 (DNS), 80 (HTTP), 443 (HTTPS), 3306 (MySQL), 5432 (PostgreSQL)。

## 11.6 アプリケーション層

### DNS

ドメイン名 → IP 変換。階層: ルート → TLD (.com) → 権威。
- レコード: A, AAAA, CNAME, MX, TXT, NS, SOA。
- 再帰解決と反復解決。
- キャッシュと TTL。
- DNSSEC: 署名による検証。
- DoH/DoT: HTTPS/TLS 越しの DNS でプライバシ保護。

### HTTP

リクエスト・レスポンス型。

- メソッド: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS。
- ステータス: 1xx 情報, 2xx 成功, 3xx リダイレクト, 4xx クライアント誤り, 5xx サーバ誤り。
- ヘッダ: Content-Type, Cache-Control, Authorization, Cookie。

#### HTTP/1.1

テキスト、Keep-Alive、パイプライン（実装が悪く廃れた）。Head-of-Line Blocking が問題。

#### HTTP/2

バイナリフレーム、多重化、HPACK 圧縮、サーバプッシュ。TCP の HoL は残る。

#### HTTP/3 (QUIC)

UDP ベース、独自に再送・順序・暗号化を行い、TCP の HoL を解消。Google・Cloudflare などで採用。

### メール

- SMTP (送信), POP3 / IMAP (受信)。
- DKIM, SPF, DMARC: なりすまし対策。

### その他

- WebSocket: HTTP からアップグレードして双方向通信。
- gRPC: HTTP/2 + Protobuf の RPC。
- MQTT: IoT 向け軽量 pub/sub。

## 11.7 TLS/SSL

通信の機密性・完全性・認証を提供。

### 流れ（TLS 1.3）

1. ClientHello（対応する暗号スイート、乱数）。
2. ServerHello（選択した暗号、証明書）。
3. 鍵交換（ECDHE）で共通鍵を確立。
4. アプリケーションデータを共通鍵で暗号化。

### 証明書

- 公開鍵 + 識別情報を CA が署名。
- ルート CA → 中間 CA → サーバ証明書のチェーン。
- 失効: CRL, OCSP, OCSP Stapling。

### ハンドシェイク高速化

- 0-RTT (TLS 1.3): 過去のセッションを再利用してすぐデータ送信。
- セッション再開、セッションチケット。

## 11.8 ソケットプログラミング

C 風 API（Python の `socket` も同じ形式）:
```python
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("example.com", 80))
s.sendall(b"GET / HTTP/1.0\r\nHost: example.com\r\n\r\n")
print(s.recv(4096))
s.close()
```

サーバ側は `bind()`, `listen()`, `accept()`。

並行処理:
- 1 接続 1 スレッド: 単純だがスケールしない。
- 1 接続 1 プロセス (`fork`): 古典的。
- イベント駆動 (`epoll`/`kqueue`): C10K 問題の解。
- async/await: 言語ランタイムが I/O 多重化を抽象化。

## 11.9 ネットワーク機器

- スイッチ: L2、MAC 学習。
- ルータ: L3、IP 転送。
- ファイアウォール: パケットフィルタ（ステートレス・ステートフル）、L7 検査。
- ロードバランサ: L4 (TCP) / L7 (HTTP) で振り分け、ヘルスチェック、セッション持続。
- リバースプロキシ: Nginx, HAProxy, Envoy。
- WAF: Web の脅威検知。
- CDN: 地理的に分散したキャッシュ（CloudFront, Akamai, Cloudflare）。

## 11.10 性能

### 帯域・遅延・ジッタ・パケットロス

帯域 = ビット/秒、遅延 = 片道 RTT/2。光速の限界（東京 → ロサンゼルス約 50 ms）は超えられない。

### TCP のスループット

$\text{Throughput} \approx \dfrac{\text{Window size}}{\text{RTT}}$

帯域遅延積 (BDP) が大きいほど大きなウィンドウが必要。

### 性能向上

- 接続再利用 (Keep-Alive)。
- HTTP/2 多重化。
- TCP Fast Open。
- 0-RTT。
- HTTP キャッシング (Cache-Control, ETag)。
- 圧縮 (gzip, Brotli)。

### 観測ツール

`ping`, `traceroute`, `mtr`, `dig`, `curl -v`, `tcpdump`, `Wireshark`, `ss`, `netstat`, `iperf`。

## 11.11 セキュリティ視点

- ARP スプーフィング、DNS キャッシュポイズニング。
- TCP RST 攻撃、SYN フラッド。
- DDoS と緩和（CDN, レート制限, Anycast）。
- 中間者攻撃 (MitM)、HSTS で HTTP→HTTPS 強制。
- 詳細は第 15 章。

## 11.12 演習

1. `192.168.1.0/26` のサブネットマスク、利用可能ホスト数を求めよ。
2. 3 ウェイハンドシェイクのシーケンス番号と ACK の遷移を図示せよ。
3. `dig www.google.com` の出力を読み、A レコード, NS レコードを説明せよ。
4. HTTP/1.1 の Head-of-Line Blocking を例で示し、HTTP/2 がどう解消するか述べよ。
5. TLS 1.3 のハンドシェイクが 1-RTT で済む理由を説明せよ。
6. Python で TCP エコーサーバを実装し、複数クライアントを `select` で扱え。
7. 1 GB の帯域・1 ms の RTT で TCP のウィンドウが 64 KB のとき、最大スループットはいくらか。
8. CDN がキャッシュするコンテンツと、しないほうが良いコンテンツの境界を述べよ。

## 11.13 まとめ

ネットワークは階層化された配管設計の傑作。リンクからアプリ層まで、各層が独立に進化しつつ全体として通信を成立させている。IP のベストエフォート、TCP の信頼性付与、TLS のセキュリティ、HTTP の意味論、DNS の名前解決――これらの組み合わせで Web は動いている。トラブルシュートでは「どの層で異常が起きたか」を切り分ける視点が決定的に重要。

## 参考文献

- Kurose & Ross, *Computer Networking: A Top-Down Approach* — 定番、トップダウン。
- Stevens, *TCP/IP Illustrated* — 実装レベルの詳細。
- Beej's Guide to Network Programming — 無料、ソケット入門。
- High Performance Browser Networking (Ilya Grigorik) — Web 性能。
- 『マスタリング TCP/IP 入門編』。
