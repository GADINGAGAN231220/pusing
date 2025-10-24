import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pemesanan Konsumsi",
  description: "Formulir Pemesanan Konsumsi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
