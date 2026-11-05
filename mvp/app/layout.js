import { Analytics } from "@vercel/analytics/next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Goldie from "./goldie";
import { I18nProvider, LanguagePicker } from "./i18n-provider";
import { countryList } from "@/lib/countries";
import { getT, getCountry } from "@/lib/i18n-server";

// Same fonts and logo as the live LJSportMind site (ljentp.vercel.app).
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-body" });
const grotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], weight: ["600", "700"], variable: "--font-display" });

export async function generateMetadata() {
  const { t } = await getT();
  return {
    // Absolute links for share previews (LinkedIn, iMessage) always point at the public site.
    metadataBase: new URL("https://ljsportmind-mvp.vercel.app"),
    title: "LJSportMind",
    description: t("meta.description"),
    icons: { icon: "/logo.svg" }
  };
}

// The visitor's language (their choice, else their browser's) and job country are read once here and
// handed to every browser component through I18nProvider.
export default async function RootLayout({ children }) {
  const [{ t, lang, dict }, country] = await Promise.all([getT(), getCountry()]);
  return (
    <html lang={lang} className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <I18nProvider lang={lang} dict={dict} country={country} countries={countryList(lang)}>
          <div className="bg-glow" aria-hidden="true" />
          <header className="topbar">
            <div className="topbar-inner">
              <a href="/" className="brand" aria-label={t("nav.home")}>
                <img src="/logo.svg" alt="" width={38} height={38} className="brand-logo" />
                <span>LJSport<span className="gold-text">Mind</span></span>
              </a>
              <div className="topbar-right">
                <LanguagePicker />
                <a href="/profile" className="topbar-cta">{t("nav.myPassport")}</a>
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="site-footer">
            <p className="footer-tag">{t("footer.advice")} <span className="gold-text">{t("footer.proof")}</span></p>
            <p>
              <a href="https://www.tiktok.com/@ljsoccer01" target="_blank" rel="noopener noreferrer">{t("footer.follow")}</a>
              <span aria-hidden="true"> · </span>
              <span>{t("footer.by")}</span>
            </p>
          </footer>
          <Goldie />
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
