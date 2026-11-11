import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import "./site.css";

const inter = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-inter-tight", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Um Lugar à Mesa", template: "%s · Um Lugar à Mesa" },
  description: "Não é uma experiência gastronômica, é gente perto de gente. Jantares de sexta para 6 a 8 pessoas.",
  openGraph: { title: "Um Lugar à Mesa", description: "Vem que tem lugar.", locale: "pt_BR", type: "website" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#000000", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
