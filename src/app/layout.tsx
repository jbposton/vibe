import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// OPEN: the app's name (brief §7). Placeholder title.
export const metadata: Metadata = {
  title: "Cocktail builder",
  description: "See why a drink tastes the way it does, and change it on purpose.",
};

export const viewport: Viewport = {
  themeColor: "#141414",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
