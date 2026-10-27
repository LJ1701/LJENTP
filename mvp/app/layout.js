import { Analytics } from "@vercel/analytics/next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Same fonts and logo as the live LJSportMind site (ljentp.vercel.app).
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });

export const metadata = {
  title: "LJSportMind",
  description: "Sports career discovery with proof: a Sports Profile, career matches and a saved plan.",
  icons: { icon: "/logo.svg" }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <header className="brand-bar">
          <a href="/" className="brand">
            <img src="/logo.svg" alt="" width={36} height={36} />
            <span>LJSport<span className="gold-text">Mind</span></span>
          </a>
        </header>
        <main>{children}</main>
        <footer className="site-footer">Advice is everywhere. Proof isn&apos;t.</footer>
        <Analytics />
      </body>
    </html>
  );
}
