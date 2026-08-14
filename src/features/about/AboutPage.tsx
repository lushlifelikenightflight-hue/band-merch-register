import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

interface AboutPageProps {
  onShowGuide: () => void;
}

const supportEmail = "lushlife.like.nightflight@gmail.com";

export function AboutPage({ onShowGuide }: AboutPageProps) {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="page about-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">STORE REGI LOG+</p>
          <h1>アプリ情報</h1>
        </div>
        <Link className="secondary compact back-link" to="/products">
          <ArrowLeft />
          商品へ
        </Link>
      </header>

      <section className="about-card">
        <h2>StoreRegiLog+</h2>
        <p>バージョン 1.0.0</p>
        <p>
          登録不要・広告なし・月額なし。ライブ物販やイベントで使える、完全オフラインの現金会計アプリです。
        </p>
      </section>

      <section className="about-card">
        <h2>データについて</h2>
        <p>
          商品、画像、在庫、会計履歴、設定はこの端末内に保存されます。開発者が管理するサーバーへの送信は行いません。
        </p>
        <p>
          端末故障、紛失、アプリ削除後のデータは開発者側で復旧できません。イベント前後にバックアップしてください。
        </p>
      </section>

      <section className="about-actions" aria-label="案内とサポート">
        <button className="secondary" onClick={onShowGuide}>
          <BookOpen />
          使い方ガイドを表示
        </button>
        <a href={`${baseUrl}privacy.html`} target="_blank" rel="noreferrer">
          <ShieldCheck />
          プライバシーポリシー
          <ExternalLink />
        </a>
        <a href={`${baseUrl}support.html`} target="_blank" rel="noreferrer">
          <ExternalLink />
          サポート・FAQ
        </a>
        <a href={`mailto:${supportEmail}`}>
          <Mail />
          {supportEmail}
        </a>
      </section>

      <p className="about-footer">販売者：村田和成（Murata Kazushige）</p>
    </div>
  );
}
