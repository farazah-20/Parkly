import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title:       { default: APP_NAME, template: `%s | ${APP_NAME}` },
  description: APP_TAGLINE,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
