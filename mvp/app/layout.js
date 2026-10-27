import { Analytics } from "@vercel/analytics/next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Same fonts and logo as the live LJSportMind site (ljentp.vercel.app).
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });

export const metadata = {
  // Absolute links for share previews (LinkedIn, iMessage) always point at the public site.
  metadataBase: new URL("https://ljsportmind-mvp.vercel.app"),
  title: "LJSportMind",
  description: "Find your place in the sports industry and prove it: a Sports Passport, career matches, live sports jobs and a saved plan.",
  icons: { icon: "/logo.svg" }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <div className="bg-glow" aria-hidden="true" />
        <header className="topbar">
          <div className="topbar-inner">
            <a href="/" className="brand" aria-label="LJSportMind home">
              <img src="/logo.svg" alt="" width={38} height={38} className="brand-logo" />
              <span>LJSport<span className="gold-text">Mind</span></span>
            </a>
            <a href="/profile" className="topbar-cta">My Passport</a>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p className="footer-tag">Advice is everywhere. <span className="gold-text">Proof isn&apos;t.</span></p>
          <p>
            <a href="https://www.tiktok.com/@ljsoccer01" target="_blank" rel="noopener noreferrer">Follow @ljsoccer01 on TikTok</a>
            <span aria-hidden="true"> · </span>
            <span>LJSportMind by LJSOCCER</span>
          </p>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
