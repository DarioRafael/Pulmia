'use client'

import { useState, useEffect, useCallback } from 'react'

export type Theme = 'dark' | 'light'

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>('dark')

    const applyTheme = useCallback((t: Theme) => {
        setThemeState(t)
        if (t === 'light') {
            document.documentElement.setAttribute('data-theme', 'light')
        } else {
            document.documentElement.removeAttribute('data-theme')
        }
        localStorage.setItem('theme', t)
    }, [])

    useEffect(() => {
        const saved = (localStorage.getItem('theme') as Theme) || 'dark'
        applyTheme(saved)
    }, [applyTheme])

    const toggleTheme = useCallback(() => {
        applyTheme(theme === 'dark' ? 'light' : 'dark')
    }, [theme, applyTheme])

    return { theme, toggleTheme }
}