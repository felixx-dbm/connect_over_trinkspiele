import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/LanguageProvider";
import FloatingBackground from "@/components/FloatingBackground";
import type { Locale } from "@/lib/i18n";

import "./globals.css";
//check



const fraunces = Fraunces({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
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
  themeColor: "#14110F",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("lang")?.value ?? "en") as Locale;

  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable}`}>
      <body className="bg-[#FAF8F3] text-[#14110F] antialiased">
        <FloatingBackground />
        <LanguageProvider locale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}