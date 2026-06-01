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
  manifest: '/pwa/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/pwa/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/pwa/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/pwa/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Kuro Note' },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
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
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kuro Note" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
