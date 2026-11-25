export const metadata = { title: "Terms · The Assist", description: "The rules for using The Assist." };

const CONTACT = "juarezluis1703@gmail.com";

// Plain-English terms of use.
export default function Terms() {
  return (
    <div className="card legal">
      <h1>Terms of use</h1>
      <p className="muted"><small>Last updated 24 November 2026</small></p>
      <p>By using The Assist you agree to these rules.</p>
      <h2>Be honest</h2>
      <ul>
        <li>Only add work that is yours, and only name references who really know your work.</li>
        <li>Don&rsquo;t pretend to be someone else, confirm your own claims, or confirm something you can&rsquo;t vouch for.</li>
        <li>Employers: only post real roles, and never ask candidates for money.</li>
      </ul>
      <p>We may hide or remove content, or close accounts, that break these rules or are reported as fake or a scam.</p>
      <h2>Your content</h2>
      <p>You keep ownership of what you upload. You let us store it and show it where you choose (for example on your public proof link).</p>
      <h2>No guarantees</h2>
      <p>The Assist shows career matches, jobs from public job boards and labels about how much a claim has been checked. We can&rsquo;t guarantee a job, that every listing is still open, or that everything a user adds is true. The service is provided as it is.</p>
      <h2>Paid features</h2>
      <p>Prices are shown before you pay. Payments are handled by Stripe.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </div>
  );
}
