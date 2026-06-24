import type { Metadata, Viewport } from "next";
import { Russo_One, Nunito } from "next/font/google";
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
  title: "Trinkspiel",
  description: "The ultimate beer game battle platform",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFFBEB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${russo.variable} ${nunito.variable}`}>
      <body className="bg-amber-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
