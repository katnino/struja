import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Struja",
  description: "Praćenje potrošnje električne energije - blok tarife, REERS 2023",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs">
      <body>{children}</body>
    </html>
  );
}
