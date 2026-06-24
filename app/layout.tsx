import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Careware Renewal Tracker",
  description: "Maintenance renewal dashboard for Renewal and Accounts teams",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
