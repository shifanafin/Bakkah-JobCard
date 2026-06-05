import type { Metadata, Viewport } from 'next'
import { Bebas_Neue, Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import PwaRegister from '@/components/PwaRegister'
import './globals.css'

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' })
const geist  = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: { default: 'AutoEdge Pro', template: '%s — AutoEdge Pro' },
  description: 'Automotive Workshop Management Platform — Al Qusais, Dubai',
  icons: { icon: '/favicon.ico', apple: '/icons/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'AutoEdge Pro' },
  applicationName: 'AutoEdge Pro',
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }, { media: '(prefers-color-scheme: light)', color: '#f9fafb' }],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply saved theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.classList.toggle('dark',t==='dark');})();` }} />
      </head>
      <body className={`${bebas.variable} ${geist.variable} font-body antialiased bg-gray-50 dark:bg-surface-900 text-gray-900 dark:text-white`}>
        <ThemeProvider>
          <PwaRegister />
          {children}
          <Toaster
            theme="system"
            position="top-right"
            toastOptions={{
              classNames: {
                toast: 'bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
