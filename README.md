# 業務日報 提出管理

社員が既存の日報を提出後に「提出済み」を記録し、直属上司がその日の未提出者をすぐ確認する、GitHub Pages 用の静的Webアプリです。npmやビルドは不要です。

## 主な機能

- メールアドレス／パスワードによるSupabase Authenticationログイン
- ワンタップで本日の提出を記録（同一日の二重登録はDBの一意制約で防止）
- 直近30営業日の自分の提出履歴
- 上司用の本日KPI・未提出フィルター・月間提出率
- モバイルファーストのレスポンシブUI

土日を対象外、締切を17:30として扱います。締切後に登録されたものは「遅延」と表示されます。

## 1. Supabaseプロジェクトを作る

1. [Supabase](https://supabase.com/) にログインし、**New project** を作成します。
2. 作成後、左の **SQL Editor** を開きます。
3. このリポジトリの `schema.sql` を全文貼り付けて **Run** します。テーブル・一意制約・RLSポリシーがまとめて作成されます。

## 2. ログイン用ユーザーとプロフィールを作る

1. Supabase Dashboard の **Authentication > Users > Add user** から、社員／上司のメールアドレスとパスワードを登録します（メール確認を省略する場合は Auto Confirm User を選択）。
2. 作成したユーザーの UUID をコピーします。
3. SQL Editorでプロフィールを登録します。まず上司、次にそのUUIDを `manager_id` に設定した直属メンバーを作ります。

```sql
-- 上司
insert into public.profiles (id, display_name, department, role)
values ('上司のUUID', '山田 太郎', '営業部', 'manager');

-- 直属メンバー
insert into public.profiles (id, display_name, department, role, manager_id)
values ('社員のUUID', '佐藤 花子', '営業部', 'member', '上司のUUID');
```

上司が読めるのは `manager_id` が自分のUUIDである**直属メンバーのみ**です。部署名が同じでも、紐付いていない他ユーザーは読めません。

## 3. 接続情報を設定する

1. `config.example.js` をコピーし、同じフォルダに `config.js` を作成します。
2. Supabase Dashboard の **Project Settings > API** で Project URL と **anon / public key** をコピーし、設定します。

```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://xxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'ここに anon public key',
  TIMEZONE: 'Asia/Tokyo',
  DEADLINE: '17:30'
};
```

`config.js` は `.gitignore` に入っているためGitHubへコミットされません。公開サイトでは anon key はブラウザへ配布されますが、RLSがデータを保護します。**service_role key はRLSを迂回するため、絶対にフロントエンドやGitHubに置かないでください。**

GitHub Pagesでも実行するには、公開前に `config.example.js` のプレースホルダーを実値に置き換えた `config.js` を、安全なデプロイ方法（GitHub Actions Secrets等）で配置してください。手作業で公開リポジトリへ `config.js` をコミットするのは避けてください。

## 4. ローカルで起動する

`index.html` をブラウザで開くだけでも表示確認できます。ログインを含めて確認するには、フォルダで簡易Webサーバーを起動します。

```powershell
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。Supabase Authenticationの **URL Configuration** にこのURLとGitHub PagesのURLを Redirect URLs として追加してください。

## 5. GitHub Pagesで公開する

1. GitHubでリポジトリを作り、`index.html`、`style.css`、`app.js`、`schema.sql`、`README.md`、`.gitignore` をコミットします。
2. **Settings > Pages** を開き、**Deploy from a branch** を選択します。
3. 公開したいブランチ（通常 `main`）とフォルダ `/ (root)` を選び、Saveします。
4. 表示された `https://<ユーザー名>.github.io/<リポジトリ名>/` をSupabaseの Redirect URLs に追加します。
5. デプロイ時に `config.js` を安全に生成・配置してから公開してください。

## 運用・拡張

- 締切は `config.js` の `DEADLINE` を `HH:MM` 形式で変更できます。
- 初期版は月〜金を営業日として判定します。将来の祝日・有休・出張は `non_working_days` テーブルを利用できるよう、スキーマを先に用意しています。画面ロジックをこのテーブル参照に拡張すれば個人別の対象外日を扱えます。
- `profiles` の作成・役割・上司紐付けは管理者がSupabase SQL Editorまたは安全な管理バックエンドで行ってください。一般ユーザーにはプロフィール更新ポリシーを与えていません。
