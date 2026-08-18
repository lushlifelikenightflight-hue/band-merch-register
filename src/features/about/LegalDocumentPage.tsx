import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface LegalDocumentPageProps {
  document: "privacy" | "support";
  title: string;
}

export function LegalDocumentPage({ document, title }: LegalDocumentPageProps) {
  const source = `${import.meta.env.BASE_URL}${document}.html`;

  return (
    <div className="page legal-document-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">STORE REGI LOG+</p>
          <h1>{title}</h1>
        </div>
        <Link className="secondary compact back-link" to="/about">
          <ArrowLeft />
          戻る
        </Link>
      </header>
      <iframe className="legal-document-frame" src={source} title={title} />
    </div>
  );
}
