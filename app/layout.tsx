import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Geist, Cairo } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";
import PwaRegister from "@/components/PwaRegister";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: "Bakkah Premium Auto Care | Car Detailing Dubai — Al Qusais",
    template: "%s | Bakkah Premium Auto Care Dubai",
  },
  description:
    "Trusted car detailing studio in Al Qusais, Dubai. Expert ceramic coating, paint correction, full detailing & RTA inspection prep. 5,000+ cars cared for. 5.0★ Google rating.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bakkah Auto Care",
  },
  verification: {
    google: "5W4RoeWT2P55uMsWOXMSx1l-HXvpYt67B_4O7sBUki0",
  },
  applicationName: "Bakkah Premium Auto Care",
  authors: [{ name: "Bakkah Premium Auto Care LLC" }],
  creator: "Bakkah Premium Auto Care LLC",
  publisher: "Bakkah Premium Auto Care LLC",
  category: "Automotive",
  classification: "Car Detailing & Auto Care Services",
  openGraph: {
    type: "website",
    locale: "en_AE",
    siteName: "Bakkah Premium Auto Care",
  },
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
    <html lang="en-AE" dir="ltr" className="dark" suppressHydrationWarning>
      <head />
      <body
        className={`${bebas.variable} ${geist.variable} ${cairo.variable} font-body antialiased bg-gray-50 dark:bg-surface-900 text-gray-900 dark:text-white`}
      >
        <ThemeProvider>
          <PwaRegister />
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
      </body>
    </html>
  );
}
