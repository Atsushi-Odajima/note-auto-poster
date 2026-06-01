import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kuro Note",
  description: "Auto writing and posting app for note.",
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }],
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Kuro Note' },
};

export const viewport: Viewport = {
  themeColor: '#050505',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
