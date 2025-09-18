import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt, OfflineIndicator } from "@/components/pwa";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Raising CRM - Telegram Mini App",
  description: "Мощная CRM-система для фрилансеров, интегрированная в Telegram",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Raising CRM",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  themeColor: "#3b82f6",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark" style={{"--tg-viewport-height":"100vh","--tg-viewport-stable-height":"100vh"}}>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <div className="min-h-screen bg-gradient-to-br from-background to-muted">
          {children}
        </div>
        <Toaster />
        <InstallPrompt />
        <OfflineIndicator />
      </body>
    </html>
  );
}
