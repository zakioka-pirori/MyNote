# 第 15 章 セキュリティ

## 学習目標

- 脅威モデリング・最小権限・多層防御という設計原則を理解する。
- 暗号（共通鍵・公開鍵・ハッシュ・署名）の役割と安全な使い方を知る。
- TLS, 認証認可 (OAuth, OIDC, JWT), Web 脆弱性 (XSS, CSRF, SQLi) を体系的に押さえる。
- メモリ安全性、サイドチャネル、サプライチェーンといった現代的脅威を把握する。

## 15.1 なぜセキュリティか

セキュリティは「機能ではなく前提」。1 度の漏洩や侵入が事業の信頼を根こそぎ奪う。**「動けば良い」ではなく「悪意ある入力に耐える」コード** を最初から書くマインドセットが必要。CS 専攻でも、セキュリティはどの分野とも交差するクロスカット的トピック。

## 15.2 セキュリティの 3 大目標 (CIA)

- **Confidentiality**: 機密性。許可された者だけが見られる。
- **Integrity**: 完全性。改ざんされていない。
- **Availability**: 可用性。必要なときに使える。

これに **Authenticity（真正性）** と **Non-repudiation（否認防止）** を加えることもある。

## 15.3 脅威モデリング

「**何を守るか・誰から守るか・どう守るか**」を体系化する。

### STRIDE

- **S**poofing: なりすまし。
- **T**ampering: 改ざん。
- **R**epudiation: 否認。
- **I**nformation Disclosure: 情報漏洩。
- **D**oS: サービス妨害。
- **E**levation of Privilege: 権限昇格。

### 攻撃面と信頼境界

データフローダイアグラムを書き、信頼境界を跨ぐ箇所を脅威候補とする。

## 15.4 設計原則

- **最小権限 (Principle of Least Privilege)**。
- **多層防御 (Defense in Depth)**。
- **デフォルト拒否 (Default Deny)**。
- **完全な仲介 (Complete Mediation)**。
- **オープン設計 (Open Design)**: 秘密を仕組みに頼らない（Kerckhoffs の原理）。
- **フェイルセーフデフォルト**。
- **心理的受容性**: 安全な道が一番楽な道。

## 15.5 暗号の基礎

### 共通鍵暗号

送受信が同じ鍵を使う。

- ブロック暗号: AES (128/192/256), ChaCha20。
- モード: ECB（使わない）, CBC, CTR, GCM, XTS。
- **AEAD** (Authenticated Encryption with Associated Data): 暗号化 + 完全性。AES-GCM, ChaCha20-Poly1305。
- パディング: PKCS#7。
- 鍵交換が課題。

### 公開鍵暗号

- RSA: 整数の素因数分解の困難性。鍵長 2048 ビット以上。
- ECC: 楕円曲線。短い鍵で同等の強度。Curve25519, P-256。
- 公開鍵で暗号化、秘密鍵で復号。
- 公開鍵で署名検証、秘密鍵で署名生成。

### ハッシュ関数

- 一方向性、衝突耐性。
- SHA-256, SHA-3, BLAKE3。
- MD5 / SHA-1 は衝突攻撃が成立しており **使用禁止**。
- パスワードハッシュは bcrypt / scrypt / Argon2 を使う（速いハッシュは禁忌）。

### 署名と MAC

- HMAC (鍵付きハッシュ): メッセージ認証コード。共通鍵。
- デジタル署名: 公開鍵で誰でも検証可能。RSASSA-PSS, ECDSA, Ed25519。

### 鍵交換

- Diffie-Hellman: 公開チャネルで共通鍵を導出。
- 楕円曲線版 (ECDH)。
- **前方秘匿性 (Forward Secrecy)**: 過去のセッションが将来の鍵漏洩で解読されない。エフェメラル鍵で達成。

### 乱数

CSPRNG（暗号学的に安全な擬似乱数）を使うこと。`/dev/urandom`、`getrandom`。`Math.random()` や C の `rand()` は禁忌。

## 15.6 PKI と証明書

公開鍵を信頼する仕組み。

- CA (Certificate Authority) が公開鍵に署名し証明書を発行。
- ルート CA → 中間 CA → サーバ証明書。
- ブラウザ・OS にルート CA がプリインストール。
- 失効: CRL, OCSP。短命証明書 (Let's Encrypt) で運用が容易に。
- Certificate Transparency: ログで CA の不正発行を検出。

## 15.7 TLS

第 11 章で触れた TLS をセキュリティ視点で。

- TLS 1.3 が現行標準。1.0 / 1.1 は廃止。
- 鍵交換は (EC)DHE のみ。前方秘匿性。
- 認証は証明書 + 署名。クライアント認証も可能。
- サイドチャネル: BEAST, CRIME, POODLE, Heartbleed（OpenSSL のバグ）。

## 15.8 認証 (Authentication)

「誰であるか」を確認する。

### 要素

- 知識（パスワード）。
- 所持（ハードウェアキー、TOTP）。
- 生体（指紋、顔）。

複数要素 = MFA / 2FA。

### パスワード

- 最低長を確保。
- bcrypt / Argon2 で保存（ソルトを各ユーザに）。
- 漏洩リストとの突合、Have I Been Pwned。
- パスフレーズ推奨、定期変更は推奨されなくなった (NIST 800-63B)。

### TOTP / WebAuthn

- TOTP: 共通秘密 + 時刻で 6 桁コード (RFC 6238)。
- WebAuthn / FIDO2: 公開鍵認証、フィッシング耐性、パスワードレス。

### SSO

- SAML: XML ベース、エンタープライズ。
- OIDC: OAuth 2.0 上の認証層、JSON/JWT、現代的。

## 15.9 認可 (Authorization)

「何ができるか」を制御する。

- ACL (Access Control List)。
- RBAC (Role-Based Access Control)。
- ABAC (Attribute-Based)。
- ReBAC (Relationship-Based, Google Zanzibar)。

### OAuth 2.0

第三者アプリにユーザの権限の一部を委譲する。
- 認可コードフロー (+ PKCE) が標準。
- アクセストークン（短命）+ リフレッシュトークン。
- スコープで権限粒度を限定。

### JWT

JSON Web Token: ヘッダ + ペイロード + 署名。
- 短命にする。
- `alg: none` を許容しない。
- 取り消しが難しいので、機密情報を入れない。
- ストレージ: HttpOnly + Secure + SameSite クッキーが安全。

## 15.10 Web 脆弱性 (OWASP Top 10)

### XSS (Cross-Site Scripting)

ユーザ入力をエスケープせず HTML に埋め込むことで JS が実行される。
- 出力時に文脈別エスケープ（HTML, 属性, JS, URL）。
- CSP (Content Security Policy) で軽減。
- DOM ベース XSS、反射型、蓄積型。

### CSRF (Cross-Site Request Forgery)

被害者の認証情報を悪用して不正リクエスト。
- CSRF トークン。
- SameSite クッキー (Lax / Strict)。
- Origin / Referer チェック。

### SQL インジェクション

ユーザ入力を SQL 文に連結して攻撃。
- **必ずプレースホルダ (Prepared Statement) を使う**。
- ORM のエスケープを信頼するが、`raw` 関数には注意。
- 最小権限の DB ユーザ。

### コマンドインジェクション

シェルに渡すときは引数配列で実行（`exec(["ls", path])`）。

### 認証認可不備

- IDOR (Insecure Direct Object Reference): `?user_id=42` を書き換えれば他人のデータが見える。
- マスアサインメント。
- 強制ブラウジング。

### SSRF (Server-Side Request Forgery)

サーバから内部 URL に強制アクセス。クラウドのメタデータ API (`169.254.169.254`) が要注意。

### XXE (XML External Entity)

XML パーサで外部エンティティを解決して情報漏洩。パーサで無効化する。

### デシリアライゼーション

信頼できないデータをデシリアライズすると任意コード実行（Java の Apache Commons Collections）。

### セキュリティヘッダ

- HSTS (Strict-Transport-Security)
- CSP
- X-Frame-Options / Frame Ancestors
- X-Content-Type-Options: nosniff
- Referrer-Policy

## 15.11 メモリ安全性

C/C++ で頻発:
- バッファオーバーフロー。
- Use-After-Free。
- ダブルフリー。
- 整数オーバーフロー。
- フォーマットストリング攻撃。

緩和策:
- ASLR (Address Space Layout Randomization)。
- DEP/NX (実行不可ページ)。
- スタックカナリア。
- CFI (Control-Flow Integrity)。
- ASan, MSan, Valgrind, fuzzing (AFL, libFuzzer)。

根本解決として **Rust や安全な言語に移行** がトレンド。

## 15.12 OS / コンテナ

- パーミッション、setuid に注意。
- Seccomp でシステムコール制限。
- SELinux / AppArmor で強制アクセス制御。
- コンテナの脱獄、特権コンテナ禁止。
- イメージスキャン (Trivy)。

## 15.13 サイドチャネル攻撃

物理・観測可能な情報からの漏洩。

- タイミング攻撃: 比較に等時間関数 (`crypto.timingSafeEqual`)。
- 電力解析、電磁波。
- キャッシュ攻撃 (Flush+Reload, Prime+Probe)。
- Spectre / Meltdown: 投機実行のサイドチャネル。

## 15.14 サプライチェーン

- 依存パッケージの脆弱性 (Log4Shell, event-stream)。
- 偽装パッケージ (typosquatting)。
- ビルド改ざん (SolarWinds)。
- SBOM, Sigstore, 再現可能ビルド、依存固定 (lock files)。

## 15.15 暗号運用の落とし穴

- 鍵を平文でリポジトリに置く。
- ECB モード、IV 使い回し。
- ロールバック耐性なし。
- 自前で暗号プリミティブを実装しない（**自分で書くな！**）。
- 標準ライブラリ・libsodium・Tink を使う。

## 15.16 インシデント対応

1. 検知。
2. 封じ込め。
3. 根絶。
4. 復旧。
5. 教訓化（ポストモーテム、非難なし）。

ログ保全、フォレンジック、責任者の連絡、規制対応 (GDPR, 個人情報保護法)。

## 15.17 演習

1. STRIDE で「ユーザがログインして商品を買う」フローの脅威を 5 つ挙げよ。
2. AES-CBC と AES-GCM の違いを、安全性の観点から述べよ。
3. パスワード保存に SHA-256 を直接使うのが危険な理由を説明せよ。
4. JWT を使った認証で「無効化が難しい」問題と、その対処を述べよ。
5. SQL インジェクションを引き起こすコードと、Prepared Statement で書き直したコードを示せ。
6. XSS を防ぐためのエスケープを HTML 属性, JS 文字列, URL の各文脈で書け。
7. CSP で `script-src 'self'` を設定する効果を述べよ。
8. Spectre 攻撃の概略と、それが投機実行というアーキテクチャ最適化に依存していることを説明せよ。

## 15.18 まとめ

セキュリティは「全員が当事者」の領域。アルゴリズム・OS・ネットワーク・DB・Web・暗号、本書で扱う全レイヤに脅威があり、**常に「悪意ある入力」を想定するパラノイア精神**が必要。標準を使う、最小権限、多層防御、観測と対応――これらをチェックリストでなく文化として身につけたエンジニアは、長期にわたって信頼される。

## 参考文献

- Anderson, *Security Engineering* — 名著、無料 PDF。
- Schneier, *Cryptography Engineering*。
- McGraw, *Software Security*。
- OWASP Top 10、OWASP Cheat Sheet Series。
- Cryptopals Crypto Challenges — 実装で学ぶ暗号。
- 徳丸浩『体系的に学ぶ 安全な Web アプリケーションの作り方』。
