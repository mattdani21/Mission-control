import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Envogue — Marketing Mission Control",
  description:
    "Envogue Marketing Mission Control — plan the year, capture the market, publish everywhere. AI-assisted marketing operations for Empyrean's Envogue pilot.",
};

const themeScript = `
try {
  if (window.localStorage.getItem("mc-theme") === "light") {
    document.documentElement.classList.add("light");
  }
} catch (e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
