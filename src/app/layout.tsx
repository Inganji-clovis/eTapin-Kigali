import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eTapin - Smart Transport for Kigali",
  description: "Seamless, accessible public transport navigation for Kigali City.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
