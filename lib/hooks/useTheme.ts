'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'dark' | 'light'

function leerTheme(): Theme {
    if (typeof window === 'undefined') return 'dark'
    return (localStorage.getItem('theme') as Theme) || 'dark'
}

function aplicarAlDOM(t: Theme) {
    if (t === 'light') {
        document.documentElement.setAttribute('data-theme', 'light')
    } else {
        document.documentElement.removeAttribute('data-theme')
    }
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => leerTheme())

    // Sincroniza el DOM con el valor inicial (solo en el cliente, una vez).
    useEffect(() => {
        aplicarAlDOM(theme)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const applyTheme = useCallback((t: Theme) => {
        setThemeState(t)
        aplicarAlDOM(t)
        localStorage.setItem('theme', t)
    }, [])

    const toggleTheme = useCallback(() => {
        applyTheme(theme === 'dark' ? 'light' : 'dark')
    }, [theme, applyTheme])

    return { theme, toggleTheme }
}