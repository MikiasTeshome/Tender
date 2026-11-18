import LegalShell from '../legal/LegalShell.jsx';
import '../legal/legal.css';

export const metadata = {
  title: 'Terms of Use | Fanos Tender',
  description: 'Terms of use for the Fanos Tender directory of Ethiopian tenders and vehicle bids.',
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Use" updated="18 November 2026">
      <div className="legal-callout">
        <strong>Important:</strong> Fanos Tender is an informational directory. You bid with the issuing organization using their own process. You do not submit bids, sealed envelopes, or CPOs on this website.
      </div>

      <h2>1. Who we are</h2>
      <p>
        These Terms of Use (“Terms”) govern access to and use of the Fanos Tender website and Android application (together, the “Service”), operated as Fanos Tender (“we”, “us”, “our”).
        By creating an account, browsing signed-in areas, or submitting a payment reference, you agree to these Terms and our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>2. What the Service is</h2>
      <p>Fanos Tender helps users discover public, NGO, private, and vehicle-related notices published for audiences in Ethiopia. The Service may show titles, issuers, regions, deadlines (East Africa Time), access levels, and—where authorized—photos and bidding instructions sourced from issuers or their materials.</p>
      <ul>
        <li>We do not run auctions, open tenders, award contracts, or collect bid securities on the platform.</li>
        <li>We are not a party to any tender, disposal, or purchase between you and an issuer.</li>
        <li>Issuers supply notice materials offline (for example by email or messaging). They do not operate the Superadmin console.</li>
      </ul>

      <h2>3. Accounts</h2>
      <p>Accounts use email one-time codes. You must provide a valid email address you control and keep access to that inbox secure. You are responsible for activity under your account. Notify us promptly if you believe your account was used without permission.</p>

      <h2>4. Subscriptions and payments</h2>
      <p>
        Some listing details (for example full bidding instructions or additional vehicle photos) may require an active paid subscription.
        Prices and bank payment instructions are published in the Service by the operator.
      </p>
      <ul>
        <li>You pay by transferring funds using the published bank instructions, then submit your transaction reference in the Service.</li>
        <li>Access is granted only after the operator verifies the reference. Verification is manual and may take business time.</li>
        <li>Unless required by applicable law, verified subscription fees are non-refundable once access has been granted for the purchased term.</li>
        <li>False, reused, or third-party payment references may be rejected and may lead to account restriction.</li>
      </ul>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Scrape, bulk-harvest, or republish Service content in a way that substitutes for the Service, except as allowed by law;</li>
        <li>Attempt to bypass paywalls, authentication, or access controls;</li>
        <li>Upload malware, abuse APIs, or interfere with other users;</li>
        <li>Misrepresent your identity or payment references;</li>
        <li>Use the Service for unlawful purposes under Ethiopian law or other applicable law.</li>
      </ul>

      <h2>6. Content accuracy and issuer rules</h2>
      <p>
        Notices are transcribed or summarized from materials provided for publication. Issuers’ original documents, corrigenda, and deadlines control.
        Always confirm requirements (eligibility, CPO, envelopes, inspection windows, and submission place) with the issuer before you bid.
        Typical procurement practices mentioned in help pages are educational only and are not legal advice.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        The Fanos Tender name, branding, software, and original compilation of the directory are protected.
        Issuer names, notice text, and photos remain subject to the rights of their respective owners.
        Authorized vehicle photos are published for directory use only and must not be reused as marketing stock without permission.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided on an “as is” and “as available” basis. We do not warrant that listings are complete, uninterrupted, or free of error.
        We are not responsible for issuer decisions, rejected bids, lost CPOs, or outcomes of any procurement or vehicle disposal.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Fanos Tender and its operators are not liable for indirect, incidental, special, consequential, or lost-profit damages arising from use of the Service or reliance on directory content.
        Our aggregate liability for claims relating to the Service is limited to the subscription fees you paid to us for the three months preceding the claim (or ETB 0 if you have no paid subscription).
      </p>

      <h2>10. Suspension and termination</h2>
      <p>
        We may suspend or terminate access if you breach these Terms, submit fraudulent payment information, or misuse the Service.
        You may stop using the Service at any time. Provisions that by nature should survive (including disclaimers and liability limits) survive termination.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these Terms to reflect product or legal changes. The “Effective” date above will change when we do.
        Continued use after an update constitutes acceptance of the revised Terms for subsequent use.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Federal Democratic Republic of Ethiopia, without regard to conflict-of-law rules.
        Courts located in Ethiopia have exclusive jurisdiction over disputes arising from these Terms, subject to any mandatory consumer protections that apply.
      </p>

      <h2>13. Contact</h2>
      <p>
        For questions about these Terms or the Service, contact the operator using the support email published on the Service or the channel you already use for Fanos Tender operations.
        Operator contact details may also appear in subscription payment instructions inside the Service.
      </p>
    </LegalShell>
  );
}
