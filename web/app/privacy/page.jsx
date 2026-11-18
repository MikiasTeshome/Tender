import LegalShell from '../legal/LegalShell.jsx';
import '../legal/legal.css';

export const metadata = {
  title: 'Privacy Policy | Fanos Tender',
  description: 'How Fanos Tender collects, uses, and stores personal data.',
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="18 November 2026">
      <div className="legal-callout">
        This Policy explains what personal data Fanos Tender processes when you use the website or Android app. It should be read together with our{' '}
        <a href="/terms">Terms of Use</a>.
      </div>

      <h2>1. Who is responsible</h2>
      <p>
        Fanos Tender (“we”, “us”) operates the Service and decides how account and directory-related personal data are processed for providing the Service in Ethiopia.
        For questions, use the operator contact published in the Service or payment instructions.
      </p>

      <h2>2. Data we collect</h2>
      <ul>
        <li><strong>Account data:</strong> email address; authentication session tokens issued by our auth provider.</li>
        <li><strong>Profile and preferences:</strong> email-alert preference; whether a push token is registered.</li>
        <li><strong>Usage related to your account:</strong> saved listings; saved search labels/filters you create; payment references, plan term, amount, and verification status.</li>
        <li><strong>Device notifications (Android):</strong> Expo push token when you enable notifications (delivered via the device push service / FCM).</li>
        <li><strong>Technical logs:</strong> standard server logs needed to operate and secure the API (for example request time and error diagnostics). We do not sell advertising profiles.</li>
      </ul>
      <p>Guests can browse public directory pages without an account. Some paid details remain locked until a verified subscription is active.</p>

      <h2>3. Why we process data</h2>
      <ul>
        <li>To authenticate you and keep your session secure;</li>
        <li>To show entitled listing details and sync saved items;</li>
        <li>To verify subscription payments and unlock paid access;</li>
        <li>To send optional email digests or push alerts about matching notices;</li>
        <li>To operate, secure, and improve the Service and prevent abuse;</li>
        <li>To meet legal obligations where they apply.</li>
      </ul>

      <h2>4. Processors and sharing</h2>
      <p>We use service providers under contract or equivalent terms to run the Service:</p>
      <ul>
        <li><strong>Supabase</strong> — email one-time-code authentication;</li>
        <li><strong>Hosting / database</strong> — application and PostgreSQL storage for accounts, listings, payments, and preferences;</li>
        <li><strong>Resend</strong> (when configured) — transactional or alert email delivery;</li>
        <li><strong>Expo / device push services</strong> — delivery of push notifications you enable on Android.</li>
      </ul>
      <p>
        We do not sell your personal data. We may disclose information if required by law, to protect rights and safety, or to a successor operator if the Service is transferred (with notice where required).
      </p>

      <h2>5. Retention</h2>
      <ul>
        <li>Account and preference data — while your account remains active and as needed for the Service;</li>
        <li>Payment references and verification history — as needed for accounting, dispute handling, and fraud prevention;</li>
        <li>Push tokens — until you disable push or the token becomes invalid;</li>
        <li>Server logs — for a limited operational period unless a security investigation requires longer retention.</li>
      </ul>

      <h2>6. Security</h2>
      <p>
        We use access controls, authenticated API requests, and provider security features.
        No method of transmission or storage is perfectly secure; protect your email inbox because it is the key to your account.
      </p>

      <h2>7. Your choices</h2>
      <ul>
        <li>Turn email alerts on or off in the Service preferences when signed in;</li>
        <li>Enable or disable Android push in the app (and in system settings);</li>
        <li>Remove saved listings from your account;</li>
        <li>Request account closure or data questions via the operator contact channel.</li>
      </ul>

      <h2>8. Children</h2>
      <p>The Service is intended for business and adult users participating in procurement or vehicle disposal processes. It is not directed at children.</p>

      <h2>9. International processing</h2>
      <p>
        Some providers may process data on servers outside Ethiopia. Where that occurs, we rely on appropriate safeguards offered by those providers and applicable law.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this Policy when our practices or the Service change. The Effective date above will be revised accordingly.
        Material changes will be reflected on this page; continued use after an update means you acknowledge the revised Policy for subsequent use.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy requests, contact the Fanos Tender operator through the support channel published in the Service or alongside payment instructions.
      </p>
    </LegalShell>
  );
}
