import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prodects Dashboard",
  description: "Laravel-matching prodects app in Next.js"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
