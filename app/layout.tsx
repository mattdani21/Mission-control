import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mission Control",
  description:
    "Mission Control — a single home base where Empyrean marketers run AI-assisted and manual marketing work: campaigns, copy, and channel sends.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
