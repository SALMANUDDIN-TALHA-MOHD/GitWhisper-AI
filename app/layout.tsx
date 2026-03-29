import type { Metadata } from 'next'
import { Inter, Syne, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300','400','500','600','700','800','900'],
  variable: '--font-inter',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['700','800'],
  variable: '--font-syne',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400','500','600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GitWhisper AI — Understand Any GitHub Repository',
  description: 'Paste any GitHub URL. Get instant code explanations, 3D activity charts, and analytics. Free to start.',
  // Keep icons here for completeness, but the <head> will override it
  icons: {
    icon: '/favicon-1.png',
    shortcut: '/favicon-1.png',
    apple: '/favicon-1.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Favicon for modern browsers */}
        <link rel="icon" type="image/png" href="/favicon-1.png" />
        {/* Shortcut icon for older browsers */}
        <link rel="shortcut icon" href="/favicon-1.png" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/favicon-1.png" />
        <title>GitWhisper AI — Understand Any GitHub Repository</title>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0d1117',
              color: '#a5b4fc',
              border: '1px solid rgba(99,102,241,0.25)',
              fontFamily: 'var(--font-inter), sans-serif',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}