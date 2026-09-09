import type { Metadata } from "next";
import { Source_Serif_4, IBM_Plex_Sans , Caveat} from "next/font/google";
import "./globals.css";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Smart Researcher",
  description: "An agent that plans, searches, reads, and writes cited reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sourceSerif.variable} ${plexSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}