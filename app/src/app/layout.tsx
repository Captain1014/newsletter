import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Newsletter Reader",
  description: "출퇴근 영어 뉴스레터 TTS 리더",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NL Reader",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${geistSans.variable} font-sans antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}
      >
        <div className="mx-auto max-w-lg min-h-dvh flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
