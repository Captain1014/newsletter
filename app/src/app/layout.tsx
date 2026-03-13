import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NODE_ENV === "production" ? "/newsletter" : "";

export const metadata: Metadata = {
  title: "Newsletter Reader",
  description: "English newsletter TTS reader for your commute",
  manifest: `${basePath}/manifest.json`,
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
        <link rel="apple-touch-icon" href={`${basePath}/icons/icon-192.png`} />
      </head>
      <body
        className="font-sans antialiased bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
      >
        <div className="mx-auto max-w-lg min-h-dvh flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
