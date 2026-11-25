export const metadata = { title: "Privacy · The Assist", description: "What The Assist collects, why, and how to have it deleted." };

const CONTACT = "juarezluis1703@gmail.com";

// Plain-English privacy policy. Keep it in step with what the code really does (prd.md lists the features).
export default function Privacy() {
  return (
    <div className="card legal">
      <h1>Privacy</h1>
      <p className="muted"><small>Last updated 24 November 2026</small></p>
      <p>The Assist helps people breaking into sports show proof of what they have done. This page says what we collect, why, and who else handles it.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> your email address. If you sign in with Google or Microsoft, we receive only your name and email address from them, never your password.</li>
        <li><strong>What you add:</strong> your Passport, portfolio items (files, links, references), stories, job preferences and anything you type into the coach.</li>
        <li><strong>References:</strong> when someone confirms a claim, we store their answer, their optional comment and their email address. Public pages show only the email&rsquo;s domain (for example @club.com), never the full address.</li>
        <li><strong>Employers:</strong> the roles you post and your work email domain.</li>
        <li><strong>Reports:</strong> the reason and details you send. Reports are private.</li>
        <li><strong>Visits:</strong> anonymous page counts (page, referrer, country, browser type) with no cookies.</li>
      </ul>

      <h2>What is public</h2>
      <p>Nothing is public until you turn on your public proof link. Then the items you chose, their trust labels and your badges are visible to anyone with the link. You can turn it off at any time.</p>

      <h2>Who else handles your data</h2>
      <ul>
        <li><strong>Supabase</strong>: stores accounts and data.</li>
        <li><strong>Vercel</strong>: hosts the site and counts visits.</li>
        <li><strong>Google Gemini</strong>: turns your achievements or an uploaded resume into suggested resume bullets.</li>
        <li><strong>Stripe</strong>: handles payments. We never see your card number.</li>
        <li><strong>Google and Microsoft</strong>: only if you choose to sign in with them.</li>
      </ul>
      <p>We do not sell your data or use it for advertising.</p>

      <h2>Your choices</h2>
      <p>You can edit or remove anything on your Passport. A reference can withdraw a confirmation from the same link. To have your account and data deleted, email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> from the address you signed up with, and we will delete it within 30 days.</p>

      <h2>Contact</h2>
      <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </div>
  );
}
