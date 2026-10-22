import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata = {
  title: "LJSportMind MVP",
  description: "Walking skeleton: sign in, profile, match, certification, verification.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
