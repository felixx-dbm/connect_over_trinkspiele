import type { Metadata, Viewport } from "next";
import { Russo_One, Chakra_Petch } from "next/font/google";
import "./globals.css";

const russo = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo",
  display: "swap",
});

const chakra = Chakra_Petch({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chakra",
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
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${russo.variable} ${chakra.variable}`}>
      <body className="bg-zinc-950 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
