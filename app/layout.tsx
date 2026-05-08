import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { PlanProvider } from '@/components/plan'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['300', '400', '500'] })

export const metadata: Metadata = {
    title: 'Pulmia',
    description: 'Asistente clinico para analisis de imagenes pulmonares',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    // En Fase 1 el plan está hardcodeado a 'free' porque todavía no hay auth.
    // En Fase 4 (Supabase Auth) se resolverá leyendo la sesión del usuario.
    return (
        <html lang="es" suppressHydrationWarning>
        <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <PlanProvider plan="free">{children}</PlanProvider>
        </body>
        </html>
    )
}