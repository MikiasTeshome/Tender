import Link from 'next/link';
import Brand from '../brand.jsx';

export default function LegalShell({title, updated, children}) {
  return (
    <div className="legal-page">
      <header className="legal-top">
        <Link href="/" className="legal-brand" aria-label="Fanos Tender home">
          <Brand />
        </Link>
        <nav className="legal-nav" aria-label="Legal">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/">Back to directory</Link>
        </nav>
      </header>
      <main className="legal-main">
        <p className="legal-kicker">Fanos Tender · Legal</p>
        <h1>{title}</h1>
        {updated && <p className="legal-updated">Effective {updated} · East Africa Time (EAT)</p>}
        <div className="legal-body">{children}</div>
      </main>
      <footer className="legal-foot">
        <p>© {new Date().getFullYear()} Fanos Tender. Bid with the issuer — not on this site.</p>
        <p>
          <Link href="/terms">Terms of Use</Link>
          {' · '}
          <Link href="/privacy">Privacy Policy</Link>
        </p>
      </footer>
    </div>
  );
}
