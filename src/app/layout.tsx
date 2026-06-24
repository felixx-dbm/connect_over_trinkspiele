import type { Metadata, Viewport } from "next";
import { Russo_One, Nunito } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";
import "./globals.css";

const russo = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo",
  display: "swap",
});

const nunito = Nunito({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Prost",
  description: "Challenge strangers to beer games at festivals, parties and bars.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prost",
  },
  icons: {
    apple: "/Icon_192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F59E0B",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("lang")?.value ?? "en") as Locale;

  return (
    <html lang={locale} className={`${russo.variable} ${nunito.variable}`}>
      <body className="bg-amber-50 text-stone-900 antialiased">
        <LanguageProvider locale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
