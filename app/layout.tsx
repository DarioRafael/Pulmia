import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Sistema IA — Deteccion de Carcinoma Pulmonar',
  description: 'Asistente clinico para analisis de imagenes pulmonares',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&display=swap"
            rel="stylesheet"
        />
      </head>
      <body className={inter.variable}>{children}</body>
      </html>
  )
}