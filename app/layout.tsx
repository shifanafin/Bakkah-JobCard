import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Geist, Cairo } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/lib/i18n";
import PwaRegister from "@/components/PwaRegister";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import { PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Bakkah Auto Detailing", template: "%s — Bakkah" },
  description: "Automotive Workshop Management Platform — Al Qusais, Dubai",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bakkah",
  },
  applicationName: "Bakkah Auto Detailing",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f9fafb" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="dark" suppressHydrationWarning>
      <head></head>
      <body
        className={`${bebas.variable} ${geist.variable} ${cairo.variable} font-body antialiased bg-gray-50 dark:bg-surface-900 text-gray-900 dark:text-white`}
      >
        <I18nProvider>
          <ThemeProvider>
            <PwaRegister />
            <PwaInstallBanner />
            <PostHogProvider>{children}</PostHogProvider>
            <Toaster
              theme="system"
              position="top-right"
              toastOptions={{
                classNames: {
                  toast:
                    "bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white",
                },
              }}
            />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
