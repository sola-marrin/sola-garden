# SOLA 静的サイト（HTML / CSS / JavaScript）

このフォルダーは、**本文を各HTMLファイルに直接記述したマルチページサイト**です。Reactやnpmは必要ありません。

## 表示する

1. VS Codeで `Sola_garden` フォルダーを開きます。
2. 拡張機能 **Live Server** をインストールします。
3. `index.html` を右クリックして **Open with Live Server** を選びます。
4. ページ内のリンクから、LIFE style、About、Works、Column、Contactへ移動できます。

`index.html` を直接開くと、トップページの見出し・文章・セクションがHTMLとして確認できます。各下層ページもそれぞれ独立したHTMLファイルです。

## 編集するファイル

| 変更内容                                     | ファイル                                 |
| -------------------------------------------- | ---------------------------------------- |
| トップページ                                 | `index.html`                             |
| 暮らしの提案                                 | `lifestyle.html`                         |
| About SOLA                                   | `about.html`                             |
| 施工事例一覧                                 | `works.html`                             |
| 施工事例の詳細                               | `works-kumo.html` など `works-*.html`    |
| Column一覧                                   | `column.html`                            |
| Columnの記事                                 | `column-tools.html` など `column-*.html` |
| Contact                                      | `contact.html`                           |
| 送信後のお礼ページ                              | `thanks.html`                            |
| 色・文字・余白・レスポンシブ                 | `css/site.css`                           |
| メニュー、スクロール演出、More、フォーム表示 | `js/app.js`                              |
| ロゴ・写真・ファビコン                       | `assets/`                                |

各ページの文章や見出しは、該当する `.html` ファイルを直接編集してください。Works/Columnのリンク先も通常のHTMLリンクです。

## 機能

- ページごとに独立した、編集可能なHTMLマークアップ
- スマートフォンHeaderは全ページ・全スクロール位置で半透明の茶色（`rgba(57, 51, 49, .55)`）と`blur(6px)`の帯。左に白のロゴ、右に丸型メールアイコンとハンバーガーを横並びで表示
- PCのHeaderは、トップのヒーロー写真の上では透明。それ以降と下層ページはスマホと同じ半透明の茶色の帯で、文字はクリーム色、ロゴは白
- ハンバーガーメニューにはTOPを含むページリンクがあり、選択すると各ページの先頭へ移動
- スクロール連動ヒーロー。PCでは全画面到達後にHero写真の固定を解除し、その後はページと一緒に画面上へ流れる
- 円形revealのメニュー、デスクトップのhoverとスマートフォンのタップ反応
- Worksのカテゴリ絞り込みとMORE、ColumnのMORE
- 画像のふわっと表示（LIFE style／Conceptは少し小さい状態から枠いっぱいに広がって止まる）
- `prefers-reduced-motion` への配慮
- 画像・ロゴ・ファビコンはローカルの `assets/` を使用
- ロゴ `assets/sola-logo-brown.svg` は、元データ `logo/Logo_White.svg` の色を茶色にし、余白を詰め、中の画像を横800pxに縮めて軽くしたもの（約140KB）。白く見せる場所はCSSの `filter` で白にしています

## コードの書式

- HTMLは2スペースのインデントを使い、`header`、`main`、`section`、`footer`などの意味のあるタグを優先します。タグ名とHTML属性名は小文字で記述します（SVGの`viewBox`など、仕様上大文字・小文字が区別される属性名は除きます）。
- 意味のないwrapperは増やさず、CSSは1宣言1行にします。
- クラス名は予測しやすいBEM形式を基本とし、見た目の指定にIDセレクターを使いません。
- CSSの宣言順は「配置 → ボックス → 見た目 → 文字 → 動作」で統一しています。
- `css/site.css` は先頭の目次どおり、ページ・パーツごとのセクションに分かれています。スマホ用の指定は末尾の `@media (max-width: 800px)` 1か所にまとめています。同じセレクターを別の場所に書き足して上書きせず、該当セクションの元の指定を直接編集してください。
- `!important` は「hidden属性」と「動きを減らす設定」以外では使いません。
- 色は `:root` の変数（`--brown`、`--lime` など）を使います。
- 本文中のリンクは役割で使い分けます。見る・読むためのリンクは文字リンク `text-link`（ホバー・タップで文字の下に薄い黄緑 `--marker` が引かれる）、相談・送信など行動するためのリンクはボタン `link-button`（色は `--button-beige` / `--button-hover` / `--button-tapped`）です。
- JSとCSSで揃える必要がある値（メニューのアニメーション時間 `MENU_DURATION` / `--menu-duration`、スマホ幅 `MOBILE_MAX_WIDTH` / `800px`）は、片方を変えたらもう片方も変更してください。

## Contactフォームについて

- 送信ボタンを押すと、`js/app.js`（`setupContactForm`）が入力内容をチェックします。エラーがあれば項目の下に日本語のメッセージを表示し、問題がなければ `thanks.html`（お礼ページ）へ移動します。
- 連絡方法で「お電話」を選んだときだけ、電話番号が必須になります。
- **今の状態ではメールは届きません**（送信せずにお礼ページへ移動する動作確認モード）。実際に受け取るには、`contact.html` の `<form ... data-endpoint="">` に Formspree などの送信先URLを入れてください。秘密鍵やトークンはブラウザー側のコードに書かないでください。
- フォームの電話番号 `03-0000-0000` と受付時間は仮の値です。公開前に `contact.html` と `thanks.html` の両方を差し替えてください。

## SNS でシェアされたときの表示（OGP）

各ページの `<head>` に、LINE・Facebook・X などでリンクを送ったときのタイトル・説明・画像（`og:` と `twitter:card`）を入れています。

- 画像は全ページ共通で `assets/ogp.jpg`（1200×630）。
- タイトルは `<title>`、説明は `<meta name="description">` と同じ文章です。説明を変えるときは、両方を変えてください。
- **公開するドメインが決まったら**、全ページの `https://example.com` を本当のURL（例：`https://sola-garden.jp`）に一括で置き換えてください。SNS は画像の場所を `https://` から始まる完全なURLでしか読めないため、仮のURLのままでは画像が出ません。
- メニューの Instagram アイコンは、今は `https://www.instagram.com/`（トップ）につながっています。アカウントができたら、各ページの `href` をアカウントのURLに置き換えてください。
- お礼ページ（`thanks.html`）は検索結果に出さない（`noindex`）ため、OGP は入れていません。
