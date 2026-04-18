'use client'

// Informe activo en memoria de sesión.
// Permite que analizar/page.tsx comparta el informe recién analizado
// con el ChatBubble global sin guardarlo en localStorage.

import { createContext, useContext, useState, useCallback } from 'react'
import type { InformeAnalisis } from '@/lib/tipos'

interface InformeActivoContextValue {
    informeActivo: InformeAnalisis | null
    setInformeActivo: (informe: InformeAnalisis | null) => void
    limpiarInformeActivo: () => void
}

const InformeActivoContext = createContext<InformeActivoContextValue | null>(null)

export function InformeActivoProvider({ children }: { children: React.ReactNode }) {
    const [informeActivo, setInformeActivo] = useState<InformeAnalisis | null>(null)
    const limpiarInformeActivo = useCallback(() => setInformeActivo(null), [])

    return (
        <InformeActivoContext.Provider value={{ informeActivo, setInformeActivo, limpiarInformeActivo }}>
            {children}
        </InformeActivoContext.Provider>
    )
}

export function useInformeActivo() {
    const ctx = useContext(InformeActivoContext)
    if (!ctx) throw new Error('useInformeActivo debe usarse dentro de InformeActivoProvider')
    return ctx
}