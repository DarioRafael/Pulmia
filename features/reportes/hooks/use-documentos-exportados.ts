'use client'

// Store de documentos exportados en localStorage.
// Misma estrategia que useEstudios y usePacientes: interfaz estable para migrar a Supabase.

import { useState, useEffect, useCallback } from 'react'
import type { DocumentoExportado, TipoDocumento } from '@/lib/tipos'

const STORAGE_KEY = 'documentos_exportados'

export interface DocumentoNuevo {
    readonly tipo: TipoDocumento
    readonly nombreArchivo: string
    readonly pacienteId?: string
    readonly estudioId?: string
    readonly tamanoKb?: number
    readonly url: string
}

function leerDocumentos(): DocumentoExportado[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as DocumentoExportado[]) : []
    } catch {
        return []
    }
}

function escribirDocumentos(documentos: DocumentoExportado[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documentos))
}

export function useDocumentosExportados() {
    const [documentos, setDocumentos] = useState<DocumentoExportado[]>([])

    // Carga inicial desde localStorage.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDocumentos(leerDocumentos())
    }, [])

    const guardar = useCallback((nuevo: DocumentoNuevo): DocumentoExportado => {
        const doc: DocumentoExportado = {
            ...nuevo,
            id: crypto.randomUUID(),
            creadoEn: new Date().toISOString(),
        }
        setDocumentos(prev => {
            const updated = [doc, ...prev]
            escribirDocumentos(updated)
            return updated
        })
        return doc
    }, [])

    const eliminar = useCallback((id: string) => {
        setDocumentos(prev => {
            const updated = prev.filter(d => d.id !== id)
            escribirDocumentos(updated)
            return updated
        })
    }, [])

    const limpiar = useCallback(() => {
        setDocumentos([])
        localStorage.removeItem(STORAGE_KEY)
    }, [])

    const totalDocumentos = documentos.length
    const totalPdf  = documentos.filter(d => d.tipo === 'pdf').length
    const totalDocx = documentos.filter(d => d.tipo === 'docx').length

    return {
        documentos,
        totalDocumentos,
        totalPdf,
        totalDocx,
        guardar,
        eliminar,
        limpiar,
    }
}