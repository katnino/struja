import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERS Kalkulator",
  description: "Elektroprivreda Republike Srpske - blok tarife, REERS 2023",
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
