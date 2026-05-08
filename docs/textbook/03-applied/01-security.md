# 第 15 章 セキュリティ

## まえがき — 1 度の漏洩がすべてを終わらせる

クレジットカード情報が漏れる、パスワードが流出する、サーバが乗っ取られる――どれも他人事ではありません。**セキュリティの失敗は事業を一発で終わらせる** 力を持ちます。

セキュリティは「機能」ではなく「**前提**」です。機能が完璧でも、悪意ある入力で簡単に壊れるアプリは、世に出してはいけません。

> **🎯 章の目標**
>
> - 脅威モデリング・最小権限・多層防御の設計原則を理解する
> - 暗号（共通鍵・公開鍵・ハッシュ・署名）の役割と安全な使い方を知る
> - TLS, OAuth, OIDC, JWT, OWASP Top 10 を体系的に押さえる
> - メモリ安全性、サイドチャネル、サプライチェーンといった現代の脅威を把握する

---

## 15.1 セキュリティの 3 大目標 — CIA

| 目標 | 内容 | 例 |
|---|---|---|
| **C**onfidentiality (機密性) | 許可された者だけが見られる | 暗号化、アクセス制御 |
| **I**ntegrity (完全性) | 改ざんされていない | ハッシュ、署名 |
| **A**vailability (可用性) | 必要なとき使える | DDoS 対策、冗長化 |

これに **Authenticity (真正性)** や **Non-repudiation (否認防止)** を加えることもあります。

---

## 15.2 脅威モデリング — STRIDE

「**何を守るか・誰から守るか・どう守るか**」を体系化。

### 15.2.1 STRIDE

| 文字 | 脅威 | 例 |
|---|---|---|
| **S**poofing | なりすまし | フィッシング |
| **T**ampering | 改ざん | 通信書き換え |
| **R**epudiation | 否認 | 「私は注文してない」 |
| **I**nformation Disclosure | 情報漏洩 | DB 流出 |
| **D**oS | サービス妨害 | DDoS, 大量リクエスト |
| **E**levation of Privilege | 権限昇格 | 一般ユーザが管理者に |

### 15.2.2 信頼境界

データフロー図を描き、信頼境界を跨ぐ箇所が脅威候補:
```
[ ユーザー ] ─── HTTPS ───>[ Web サーバ ] ─── 内部 ───>[ DB ]
              ↑                                         ↑
              ここが境界                                ここも境界
```

「**境界を超えるデータは全部疑え**」が鉄則。

---

## 15.3 設計原則

### 15.3.1 Saltzer & Schroeder の 8 原則

1. **最小権限 (Least Privilege)**: 必要最小限の権限だけ与える
2. **デフォルト拒否 (Fail-safe Defaults)**: 明示的に許可されたものだけ許す
3. **完全な仲介 (Complete Mediation)**: すべてのアクセスをチェック
4. **オープン設計 (Open Design)**: 仕組みは公開、鍵だけ秘密 (Kerckhoffs の原理)
5. **権限分離 (Separation of Privilege)**: 複数の認可を要求
6. **共通機構の最少化 (Least Common Mechanism)**: 共有資源を減らす
7. **心理的受容性 (Psychological Acceptability)**: 安全な道が一番楽な道
8. **多層防御 (Defense in Depth)**: 1 つ突破されても次の層で守る

### 15.3.2 例: 銀行の金庫

- 物理ドア + ロック (層 1)
- カード認証 (層 2)
- 生体認証 (層 3)
- 監視カメラ (層 4)
- 警備員 (層 5)

「**層が多いほど突破は難しくなる**」。ソフトウェアも同じ。

---

## 15.4 暗号の基礎

### 15.4.1 共通鍵暗号 (対称鍵暗号)

送信者と受信者が **同じ鍵** を使う。

| 暗号 | 鍵長 | 推奨 |
|---|---|---|
| AES-128/192/256 | 128/192/256 ビット | ✓ |
| ChaCha20 | 256 ビット | ✓ |
| DES, 3DES | 56/168 ビット | ❌ 廃止 |

#### モード

- **ECB**: 同じ平文ブロック → 同じ暗号文。**絶対に使わない**
- **CBC**: 前のブロックと連鎖
- **CTR**: カウンタ + 鍵
- **GCM**: CTR + 認証 (AEAD)

**AEAD (Authenticated Encryption with Associated Data)**: 暗号化 + 完全性を同時に保証。AES-GCM, ChaCha20-Poly1305 が現代の標準。

### 15.4.2 公開鍵暗号 (非対称鍵暗号)

公開鍵と秘密鍵のペア。

| 用途 | 鍵 |
|---|---|
| 暗号化 | 公開鍵で暗号化、秘密鍵で復号 |
| 署名 | 秘密鍵で署名、公開鍵で検証 |

#### 主要アルゴリズム

- **RSA**: 素因数分解の困難性。鍵長 2048 ビット以上
- **ECC**: 楕円曲線。短い鍵で同等強度 (Curve25519, P-256)
- **EdDSA**: 楕円曲線署名 (Ed25519)

公開鍵暗号は遅いので、**鍵交換** に使い、本体は共通鍵で暗号化（ハイブリッド方式）。

### 15.4.3 ハッシュ関数

「**任意長 → 固定長**」「**一方向**」「**衝突困難**」。

| ハッシュ | 出力 | 用途 |
|---|---|---|
| SHA-256, SHA-3 | 256 bit | 汎用、TLS |
| BLAKE3 | 任意長 | 高速 |
| SHA-512 | 512 bit | 強度 |
| MD5, SHA-1 | - | **廃止、衝突攻撃成功** |

#### パスワードハッシュは別物

普通のハッシュは速すぎて、辞書攻撃に弱い。**bcrypt, scrypt, Argon2** を使う。

```python
import bcrypt
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
```

### 15.4.4 署名と MAC

- **HMAC**: 共通鍵 + ハッシュ。メッセージ認証
- **デジタル署名**: 公開鍵で誰でも検証可能

```
HMAC: 「私（鍵を持つ人）が確かに送った」
署名: 「私（秘密鍵保持者）が送ったし、誰でも証明できる」
```

### 15.4.5 鍵交換と前方秘匿性

#### Diffie-Hellman

公開チャネルで共通鍵を導出。

```
Alice ──g^a──→ Bob
Bob   ──g^b──→ Alice
両者が g^(ab) を計算 → 共通鍵
```

#### 前方秘匿性 (Forward Secrecy)

「**過去のセッションが、将来の鍵漏洩で解読されない**」。エフェメラル鍵 (一時鍵) で達成。

TLS 1.3 では **前方秘匿性が必須**。

### 15.4.6 乱数

CSPRNG (暗号学的に安全な擬似乱数) を使う。

```python
import secrets   # CSPRNG
token = secrets.token_hex(32)
```

`Math.random()`, C の `rand()` は **絶対に使わない**。鍵生成・トークン生成では即脆弱。

### 15.4.7 自前で暗号を実装するな

「**自分で書くな！**」が鉄則。

- 標準ライブラリ
- libsodium (NaCl)
- Google Tink

これらを使う。自前実装は 99% 何かしらの脆弱性が混入します。

---

## 15.5 PKI と証明書

### 15.5.1 認証局 (CA)

公開鍵 + 識別情報を CA が署名。

```
ルート CA (ブラウザにプリインストール)
    ↓ 署名
中間 CA
    ↓ 署名
サーバ証明書 (example.com の)
```

### 15.5.2 失効

- CRL (Certificate Revocation List)
- OCSP, OCSP Stapling
- 短命証明書 (Let's Encrypt は 90 日) で運用が容易に

### 15.5.3 Certificate Transparency

CA の **不正発行** を防ぐため、すべての証明書を公開ログに記録。第三者が監視可能。

---

## 15.6 TLS

第 11 章で扱った TLS をセキュリティ視点で。

- **TLS 1.3** が現行標準。1.0 / 1.1 は廃止
- 鍵交換は (EC)DHE のみ → 前方秘匿性
- 認証は証明書 + 署名
- クライアント認証も可能 (mTLS)

#### 過去の脆弱性

- **BEAST** (2011): CBC モードの弱点
- **CRIME, BREACH**: 圧縮の弱点
- **POODLE**: SSL 3.0
- **Heartbleed** (2014): OpenSSL のバグ。鍵を含むメモリが漏れる

「**古いプロトコル/ライブラリは即時更新**」が鉄則。

---

## 15.7 認証 (Authentication) — 「誰?」を確認

### 15.7.1 3 要素

- **知識**: パスワード、PIN
- **所持**: スマホ、ハードウェアキー
- **生体**: 指紋、顔、虹彩

複数要素 = MFA / 2FA。**パスワードだけ + 漏洩**で簡単に侵入されるので、MFA は必須。

### 15.7.2 パスワード

- 最低長 (12 文字以上推奨)
- bcrypt / Argon2 で保存（**ソルトを各ユーザに**）
- 漏洩リストとの突合 (Have I Been Pwned)
- パスフレーズ推奨
- **定期変更は不要** (NIST 800-63B が方針転換)

### 15.7.3 TOTP / WebAuthn

- **TOTP**: 共通秘密 + 時刻で 6 桁コード (RFC 6238)。Google Authenticator など
- **WebAuthn / FIDO2**: 公開鍵認証、フィッシング耐性、パスワードレス。**現代の最強認証**

### 15.7.4 SSO (Single Sign-On)

- **SAML**: XML ベース、エンタープライズ
- **OIDC** (OpenID Connect): OAuth 2.0 上の認証層、JSON/JWT、現代的

---

## 15.8 認可 (Authorization) — 「何ができる?」を制御

### 15.8.1 モデル

- **ACL** (Access Control List)
- **RBAC** (Role-Based Access Control)
- **ABAC** (Attribute-Based)
- **ReBAC** (Relationship-Based, Google Zanzibar)

### 15.8.2 OAuth 2.0

第三者アプリにユーザの権限の一部を委譲。

#### 認可コードフロー (+ PKCE)

```
1. ユーザ → アプリ「ログイン」
2. アプリ → 認可サーバ (例: Google)「認可リクエスト」
3. ユーザ → 認可サーバで認証・許可
4. 認可サーバ → アプリ「認可コード」
5. アプリ → 認可サーバ「コード → アクセストークン交換」
6. アプリ → リソースサーバ「トークンで API 呼び出し」
```

PKCE (Proof Key for Code Exchange) でモバイル・SPA も安全に。

### 15.8.3 JWT

JSON Web Token: ヘッダ + ペイロード + 署名。

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
  ヘッダ              ペイロード         署名
```

#### 注意点

- 短命にする (15 分とか)
- **`alg: none` を許容しない** (古典的な脆弱性)
- 取り消しが難しいので、機密情報を入れない
- ストレージ: HttpOnly + Secure + SameSite クッキーが安全

---

## 15.9 OWASP Top 10 — Web の必須脆弱性

OWASP が定期更新する **Web アプリ脆弱性ランキング**。

### 15.9.1 XSS (Cross-Site Scripting)

ユーザ入力を **エスケープせず HTML に埋め込む** ことで JS が実行される。

```html
<!-- 危険 -->
<div>こんにちは、<%= user_input %></div>

<!-- 安全 -->
<div>こんにちは、<%= escape_html(user_input) %></div>
```

#### 対策

- 出力時に **文脈別エスケープ** (HTML, 属性, JS, URL)
- CSP (Content Security Policy) で軽減
- DOM ベース XSS、反射型、蓄積型に注意

### 15.9.2 CSRF (Cross-Site Request Forgery)

被害者の認証情報を悪用して不正リクエスト。

```html
<!-- 攻撃者のサイトに -->
<img src="https://bank.com/transfer?to=attacker&amount=10000">
```

ログイン中のユーザがこのページを見ると、勝手に送金される。

#### 対策

- **CSRF トークン**
- **SameSite クッキー** (Lax / Strict)
- Origin / Referer チェック

### 15.9.3 SQL インジェクション

ユーザ入力を SQL 文に **連結**:

```python
# 危険！
query = f"SELECT * FROM users WHERE name = '{name}'"
# name = "' OR '1'='1" でログイン突破
```

```python
# 安全 (Prepared Statement)
cur.execute("SELECT * FROM users WHERE name = ?", (name,))
```

#### 対策

- **必ず Prepared Statement / プレースホルダ**
- ORM のエスケープを信頼するが、`raw` 関数には注意
- 最小権限の DB ユーザ

### 15.9.4 認証認可不備

#### IDOR (Insecure Direct Object Reference)

```
GET /api/order/123    ← 他人の注文も見えてしまう
```

URL のパラメータを書き換えるだけで他人のデータが見える。

#### 対策

- 認可チェック (「ユーザ X が注文 123 を見られるか」)
- UUID や暗号化トークンで予測困難に
- 強制ブラウジングを防ぐ

### 15.9.5 SSRF (Server-Side Request Forgery)

サーバから内部 URL に強制アクセス:

```
POST /fetch  url=http://169.254.169.254/latest/meta-data/
```

クラウドのメタデータ API が漏洩 → クレデンシャル流出 (Capital One 事件、2019)。

#### 対策

- 外部リクエストを許可リストで制限
- メタデータ API を IMDSv2 で保護

### 15.9.6 XXE (XML External Entity)

XML パーサで外部エンティティを解決。**外部ファイル読み込み・SSRF**。

```xml
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<foo>&xxe;</foo>
```

対策: パーサで外部エンティティを無効化。

### 15.9.7 デシリアライゼーション

信頼できないデータをデシリアライズすると **任意コード実行**。

- Java の Apache Commons Collections (Log4j 以前の最大級)
- Python の `pickle` (絶対に信頼できないデータには使わない)

### 15.9.8 セキュリティヘッダ

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
```

これらを設定するだけで、多くの攻撃を緩和できます。

---

## 15.10 メモリ安全性 — C/C++ の罠

### 15.10.1 主要な脆弱性

- **バッファオーバーフロー**
- **Use-After-Free**
- **ダブルフリー**
- **整数オーバーフロー**
- **フォーマットストリング攻撃**

### 15.10.2 緩和策

| 対策 | 内容 |
|---|---|
| ASLR | アドレス空間ランダム化 |
| DEP/NX | データ実行禁止 |
| スタックカナリア | スタック破壊検出 |
| CFI | 制御フロー整合性 |

### 15.10.3 ツール

- AddressSanitizer (ASan)
- MemorySanitizer (MSan)
- Valgrind
- Fuzzing (AFL, libFuzzer)

### 15.10.4 根本解決: メモリ安全な言語

**Rust** が代表。所有権 + 借用で **コンパイル時に** メモリ安全を保証。

```rust
fn main() {
    let s = String::from("hello");
    let s2 = s;             // 所有権が移動
    // println!("{}", s);   // コンパイルエラー！
}
```

GitHub の調査では、Rust への移行で **70% のメモリ脆弱性が消える**。

---

## 15.11 OS / コンテナのセキュリティ

- **パーミッション**, **setuid** に注意
- **Seccomp** でシステムコール制限
- **SELinux / AppArmor** で強制アクセス制御
- **コンテナの脱獄**, **特権コンテナ禁止**
- **イメージスキャン** (Trivy, Snyk)

---

## 15.12 サイドチャネル攻撃

「**直接データを盗まなくても、観測から推測**」。

### 15.12.1 タイミング攻撃

```python
# 危険: 文字数で時間が変わる → 漏洩
def check_password(input, correct):
    return input == correct

# 安全: 一定時間で比較
import hmac
hmac.compare_digest(input, correct)
```

### 15.12.2 キャッシュ攻撃

- Flush+Reload
- Prime+Probe

### 15.12.3 Spectre / Meltdown

CPU の **投機実行** を悪用 (2018)。第 9 章参照。

物理的・観測的な情報からの漏洩は奥が深いです。

---

## 15.13 サプライチェーン攻撃

依存ライブラリ経由の攻撃が増加中:
- **Log4Shell** (2021): Log4j の RCE
- **event-stream** (2018): npm パッケージに悪意のあるコード混入
- **SolarWinds** (2020): ビルド改ざん

### 15.13.1 対策

- SBOM (Software Bill of Materials)
- 依存パッケージのバージョン固定 (lockfile)
- 自動スキャン (Dependabot, Snyk)
- 再現可能ビルド
- Sigstore (署名)

---

## 15.14 暗号運用の落とし穴

- 鍵を **平文でリポジトリに置く** (頻発！)
- ECB モード使用
- IV 使い回し
- ロールバック耐性なし
- 自前暗号実装

GitHub には毎日 **大量の AWS キー、GitHub トークン** が公開されています。`git secret`, `Vault`, `AWS Secrets Manager` で管理。

---

## 15.15 インシデント対応

```
1. 検知 (アラート)
   ↓
2. 封じ込め (拡大防止)
   ↓
3. 根絶 (脆弱性修正)
   ↓
4. 復旧 (サービス再開)
   ↓
5. 教訓化 (ポストモーテム)
```

- ログ保全
- フォレンジック
- 規制対応 (GDPR, 個人情報保護法)
- 被害者への通知

「**非難なし** (blameless)」のポストモーテム文化が再発防止につながります。

---

## 15.16 演習問題

1. STRIDE で「ユーザがログインして商品を買う」フローの脅威を 5 つ挙げよ。
2. AES-CBC と AES-GCM の違いを、安全性の観点から述べよ。
3. パスワード保存に SHA-256 を直接使うのが危険な理由を説明せよ。
4. JWT を使った認証で「無効化が難しい」問題と、その対処を述べよ。
5. SQL インジェクションを引き起こすコードと、Prepared Statement で書き直したコードを示せ。
6. XSS を防ぐためのエスケープを HTML 属性, JS 文字列, URL の各文脈で書け。
7. CSP で `script-src 'self'` を設定する効果を述べよ。
8. Spectre 攻撃の概略と、それが投機実行というアーキテクチャ最適化に依存していることを説明せよ。
9. OAuth 2.0 認可コードフロー + PKCE を図示せよ。
10. 自分のリポジトリに `git secrets` を導入し、誤コミットを防ぐ設定を書け。

---

## 15.17 この章のまとめ

| 視点 | キーワード |
|---|---|
| 設計 | STRIDE, 最小権限, 多層防御 |
| 暗号 | AES-GCM, RSA, ECC, bcrypt |
| 認証認可 | MFA, WebAuthn, OAuth, OIDC |
| Web | OWASP Top 10 (XSS, CSRF, SQLi) |
| メモリ | Rust, ASan |
| 運用 | シークレット管理, 監査, ポストモーテム |

**「悪意ある入力」を常に想定するパラノイア精神**+「**標準ライブラリを使う**」+「**最小権限**」+「**観測と対応**」が現代エンジニアの装備。

## 15.18 次に読むもの

- Anderson, *Security Engineering* — 名著、無料 PDF
- Schneier, *Cryptography Engineering*
- McGraw, *Software Security*
- OWASP Top 10、OWASP Cheat Sheet Series
- Cryptopals Crypto Challenges — 実装で学ぶ
- 徳丸浩『体系的に学ぶ 安全な Web アプリケーションの作り方』

> **🌟 メッセージ**
> セキュリティは「**全員が当事者**」の領域。**「動けば良い」ではなく「悪意ある入力に耐える」コードを書くマインドセット**を、最初の 1 行から持ちましょう。
