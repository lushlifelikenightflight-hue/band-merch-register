# StoreRegiLog+ Capacitor導入前チェックリスト

- 対象: App Store版 1.0.0
- 最終更新日: 2026-08-18
- 正式仕様: `docs/APP_STORE_SALES_SPEC.md`
- 目的: 既存PWAを壊さずにiPhone/iPad向けCapacitorアプリへ移行できる状態を確認する

## チェック状態

- `[x]`: 現在のリポジトリまたは確定済み方針で確認済み
- `[ ]`: Capacitor導入前または提出前に作業・確認が必要
- チェックを完了したときは、必要に応じて確認日、端末、OS、コミットまたは証跡を追記する

## 1. 製品仕様と販売条件

- [x] 買い切り500円、発売割引なし、値上げ予定なし
- [x] 無料体験、広告、月額課金、アプリ内課金を導入しない
- [x] 初回販売地域を日本、対応言語を日本語とする
- [x] 現金会計専用とし、外部決済を初回版へ含めない
- [x] 初回リリース機能と対象外機能を販売仕様書へ固定した
- [x] 販売中および販売終了後最低1年間のサポート方針を固定した
- [x] App Store Connectで日本向け通常価格500円を設定した

## 2. Appleアカウントと契約

- [x] 販売者本人のApple Accountを確認した
- [x] Apple Developer Program 1年間メンバーシップが有効になった
- [x] Kazushige Murataの個人名義でApple Developer Programへ登録した
- [x] App Store Connectへのアクセスを確認した
- [x] Paid Apps Agreementへ同意し、有効になった
- [x] 銀行口座情報を登録し、有効になった
- [x] 必須の米国税務フォーム2件を提出し、有効になった
- [ ] App Store Small Business Programの条件を確認し、必要なら申請する
- [x] App Store Connect APIキーを作成し、リポジトリ外へ保管した
- [x] 秘密鍵、証明書、APIキーをGitへコミットしない運用を確認した

## 3. 製品識別子と権利

- [x] 「StoreRegiLog+」でApp Store Connectのアプリレコードを作成した
- [ ] 商標・類似名称を確認し、第三者の権利を侵害しないことを確認する
- [x] Bundle IDを `com.lushlifelikenightflight.storeregilog` に決定する
- [x] 確定したBundle IDをApple Developerへ登録した
  - 初回ビルドのアップロード後は安易に変更しない
- [x] App Store ConnectのSKUを `storeregilog-ios-001` に決定し登録した
- [ ] アプリ内の製品名表記をStoreRegiLog+へ統一する
- [x] `public/icons/` 以下の画像が販売者による自作であることを確認する
- [x] 既存効果音2件の出所がWondershare Filmora標準オーディオライブラリであることを確認する
- [x] Filmora効果音2件を削除し、外部音源ファイルを同梱しないWeb Audio API生成音へ差し替えた
- [x] アプリアイコンは自作、効果音はプログラム生成であり、初回版の当該素材に第三者音源を同梱しないことを確認した
- [x] 素材の出所と差し替え判断を販売仕様書へ記録した
- [ ] サードパーティライブラリのライセンス一覧を作成する
- [ ] 必要なライセンス表記をアプリ内またはサポートサイトへ掲載する

## 4. 既存Web/PWAの基準状態

- [x] React、TypeScript、Viteで構成されている
- [x] PWAマニフェストとオフラインキャッシュが存在する
- [x] IndexedDB/Dexieで商品、履歴、設定を保存している
- [x] JSONバックアップの作成、置換復元、追加復元が存在する
- [x] 外部API、ログイン、広告SDK、解析SDKを初回調査時点で使用していない
- [x] 2026-08-14時点でESLintが成功した
- [x] 2026-08-14時点でVitest 9ファイル、28テストが成功した
- [x] 2026-08-14時点でPrettierの整形チェックが成功した
- [x] 2026-08-14時点でTypeScriptとViteの本番ビルドが成功した
- [x] 2026-08-14時点でモバイルSafari相当のPlaywright E2Eが1件成功した
- [x] E2E用ViteとPlaywrightが同じURLを使い、ポート競合時に別サイトを誤検査しない構成にした
- [x] 初回起動ガイド、アプリ情報画面、プライバシー・サポートページへの導線を実装しE2Eで確認した
- [x] 実機としてiPhone 11（iOS 26.6）とiPad第7世代（iPadOS 18.5）を使用できる
- [x] Capacitor導入直前のコミットで `npm run format:check` を実行した
- [x] Capacitor導入直前のコミットで `npm run lint` を実行した
- [x] Capacitor導入直前のコミットで `npm run test` を実行した
- [x] Capacitor導入直前のコミットで `npm run build` を実行した
- [x] Capacitor導入直前のコミットで `npm run test:e2e` を実行した
- [x] 導入前コミット `809e28d` を作成し、復帰点を確保した

## 5. Capacitor導入設計

- [x] Capacitor 8.5.0とNode.js 22以上の要件を確認し、Node.js 22.23.1で導入した
- [x] Capacitor 8の要件であるXcode 26.0以上を確認し、CIではXcode 26.3を選定した
- [x] `@capacitor/core`、`@capacitor/cli`、`@capacitor/ios` を8.5.0へ揃えた
- [x] `capacitor.config.ts` をBundle ID、StoreRegiLog+、`dist`で作成した
- [x] 最低Deployment TargetをiOS/iPadOS 16.0に設定した
- [x] iPhoneとiPadを対応端末に設定した（`TARGETED_DEVICE_FAMILY = "1,2"`）
- [ ] 初回版の画面方向を縦向き基本としてXcode設定と一致させる
- [x] Web版とNative版をCapacitorの実行環境判定で分離した
- [x] Native版ではPWAのService Worker登録と更新バナーを無効化した
- [x] Web版では現在のPWA機能を維持し、モバイルSafari相当E2Eで確認した
- [ ] BrowserRouterのリロード、アプリ再開、深いパスでの動作をNative版で確認する
- [x] Safe Areaをステータスバー、Dynamic Island、ホームインジケータへ適用するCSSを確認した
- [ ] iPadの画面幅でも操作領域が過度に広がらないレイアウトを確認する
- [ ] ソフトウェアキーボード表示時に金額入力と会計ボタンが隠れないことを確認する

## 6. ネイティブ機能

- [x] iOS共有シートを使ったバックアップ保存方式を実装した
- [x] Capacitor Share 8.0.1とFilesystem 8.1.2を選定した
- [ ] JSONファイルを「ファイル」アプリやiCloud Driveへ保存できることを確認する
- [ ] 「ファイル」アプリからJSONバックアップを選択して復元できることを確認する
- [x] Capacitor Haptics 8.0.2で会計完了時の成功フィードバックを実装した
- [x] ハプティックが利用できない環境でも会計処理が失敗しないようにした
- [ ] 商品画像の選択をシステムピッカー経由に限定し、不要な写真ライブラリ権限を要求しない
- [ ] 使用する権限とInfo.plistのPurpose Stringを必要最小限にする
- [ ] 外部リンクをSafariまたは適切なアプリ内ブラウザーで安全に開く

## 7. 保存・移行・データ保護

- [ ] WKWebViewで既存Dexieスキーマを作成できることを確認する
- [ ] アプリ終了後と端末再起動後もIndexedDBデータが残ることを確認する
- [ ] アプリ更新で既存データが保持されることを確認する
- [ ] 旧バックアップ形式を現在のスキーマへ正規化して復元できることを確認する
- [ ] 大量の商品画像を保存した場合の容量上限と失敗表示を確認する
- [ ] 保存容量不足時に既存データを破損させず、利用者へ説明を表示する
- [ ] 復元処理をトランザクション内で行い、途中失敗時に不完全な状態を残さないことを確認する
- [ ] 置換復元前に不可逆操作であることを明確に表示する
- [ ] アプリ削除で端末内データも削除されることを利用者へ案内する
- [ ] バックアップなしのデータを開発者が復旧できないことをアプリ内へ表示する
- [ ] 機種変更前のバックアップ手順をFAQへ掲載する

## 8. プライバシー・法務・サポート

- [x] 公開HTTPS URLでプライバシーポリシーを公開し、HTTP 200を確認した
- [x] ローカル版プライバシーポリシーへ「外部送信なし」「端末内保存」「保存期間」「削除方法」を記載する
- [x] アプリ内からプライバシーポリシーを容易に開けるようにする
- [x] App Store ConnectのApp Privacyを「データの収集なし」で公開した
- [x] 公開HTTPS URLでサポートページとFAQを公開し、HTTP 200を確認した
- [x] アプリ内とローカル版サポートページへ問い合わせ先 `lushlife.like.nightflight@gmail.com` を掲載する
- [x] 通常回答目安が3営業日以内であることを掲載する
- [x] サポート対象・対象外とデータ復旧不能の範囲を掲載する
- [x] 販売終了後最低1年間の重大不具合・OS互換性対応方針を掲載する
- [x] Apple標準EULAを採用した
- [ ] 日本での有料アプリ販売に必要な表示・税務・消費者保護上の確認を行う

## 9. ストア素材

- [x] 自作の1024×1024ピクセルApp Store用アイコンをiOSプロジェクトへ反映した
- [x] App Store用アイコンにアルファチャンネルや事前の角丸がないことを確認した
- [ ] iPhone向けスクリーンショットを作成する
- [ ] iPad向けスクリーンショットを作成する
- [ ] スクリーンショットに実在人物や実取引のデータを使用しない
- [x] アプリ名、サブタイトル、説明文、キーワードを日本語で作成し保存した
- [x] 「登録不要・広告なし・月額なし・完全オフライン・買い切り」を正確に説明した
- [x] 非対応機能を提供しているように見える表現を避けた
- [x] サポートURLとプライバシーポリシーURLを登録した
- [x] 年齢レーティング4+、カテゴリ、著作権表示を決定した

## 10. CI、署名、TestFlight

- [x] クラウドMacとして公開リポジトリのGitHub Actions標準`macos-15` runnerを選定した
- [x] Xcode 26.3をCIで明示的に選択し、実行時にバージョンを出力する
- [x] CIでWebビルド、`npx cap sync ios`、署名なしSimulatorビルドを検証するワークフローを作成した
- [x] 手動実行専用のTestFlightワークフローでWebビルド、`npx cap sync ios`、署名付きXcode Archiveを行う構成を追加した
- [x] Distribution CertificateとProvisioning Profileを暗号化SecretでCIへ渡す方式に決定した
  - `APP_STORE_CONNECT_KEY_ID`
  - `APP_STORE_CONNECT_ISSUER_ID`
  - `APP_STORE_CONNECT_API_KEY_BASE64`
  - `IOS_DISTRIBUTION_CERTIFICATE_BASE64`
  - `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`
  - `IOS_PROVISIONING_PROFILE_BASE64`
- [x] App Store Connect APIキー、署名証明書、Provisioning ProfileをCIの暗号化Secretへ登録した
- [ ] Secretがログ、成果物、Pull Requestへ出力されないことを確認する
- [ ] 署名済みビルドをApp Store Connectへアップロードする
- [ ] TestFlightでiPhone 11へインストールする
- [ ] TestFlightでiPad第7世代へインストールする
- [ ] 初回起動、更新、再インストールの違いを確認する

## 11. 実機受け入れ試験

- [ ] 機内モードで起動できる
- [ ] 機内モードで商品を登録・編集・削除できる
- [ ] 商品画像を設定できる
- [ ] 商品を並べ替えられる
- [ ] 在庫あり、在庫0、売り切れ、販売再開が正しく動作する
- [ ] 預かり金不足では会計を確定できない
- [ ] 会計確定で履歴と在庫が同時に更新される
- [ ] 直前会計取消で履歴削除と在庫復元が同時に行われる
- [ ] 日別売上、件数、点数、商品別数量が一致する
- [ ] 会計完了時にハプティックと設定に応じた効果音が動作する
- [ ] バックアップを共有シートから端末外へ保存できる
- [ ] バックアップの置換復元と追加復元が正しく動作する
- [ ] 不正なJSONや対応外ファイルを安全に拒否する
- [ ] アプリ終了後と端末再起動後もデータが残る
- [ ] 端末の文字サイズを変更しても主要操作ができる
- [ ] VoiceOverで主要ボタンの目的を判別できる
- [ ] iPhone/iPadでセーフエリア、キーボード、スクロールに問題がない
- [ ] 主要操作中にクラッシュ、白画面、回復不能な状態が発生しない

## 12. Capacitor導入開始ゲート

次の条件をすべて満たした時点で、Capacitorパッケージの追加とiOSプロジェクト生成を開始する。

- [x] Apple Developer Program登録方針と販売者名義に変更がない
- [x] Bundle IDが確定している
- [x] アイコン・効果音など既存素材の権利確認に重大な問題がない
- [x] Web/PWA版の全チェックが成功している
- [x] 導入前の復帰点がGitコミット `809e28d` に確保されている
- [x] Native版でService Workerを無効化する実装が完了している
- [x] バックアップ共有とハプティックに使う公式プラグインを導入済み
- [x] クラウドMacをGitHub Actions `macos-15`、Xcodeを26.3に決定した

ゲート通過後も、Appleのアカウント登録、契約、ストア素材、公開WebページはCapacitor実装と並行して進められる。ただし、TestFlight外部配布またはApp Review提出前には本チェックリストの該当項目を完了する。
