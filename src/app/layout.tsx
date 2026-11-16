import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Instrument Serif for the drink name, Instrument Sans for everything else.
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

// OPEN: the app's name (brief §7). Placeholder title.
export const metadata: Metadata = {
  title: "Cocktail builder",
  description: "See why a drink tastes the way it does, and change it on purpose.",
};

export const viewport: Viewport = {
  themeColor: "#1A1612",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${instrumentSerif.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
