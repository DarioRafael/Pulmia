'use client'

// Vista detallada de un estudio individual.
// Muestra el informe completo con radiografía, Grad-CAM y patologías.

import { useParams, useRouter } from 'next/navigation'
import { HeaderApp } from '@/components/layout/header-app'
import { InformeResultado } from '@/features/analisis'
import { useEstudios } from '@/features/estudios'

export default function EstudioDetallePage() {
    const params = useParams()
    const router = useRouter()
    const { obtener } = useEstudios()
    const id = typeof params.id === 'string' ? params.id : ''
    const estudio = obtener(id)

    if (!estudio) {
        return (
            <>
                <HeaderApp titulo="Estudio no encontrado" />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: 'var(--t2)' }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
                        <div style={{ fontSize: 14 }}>Este estudio no existe o fue eliminado.</div>
                        <button
                            onClick={() => router.push('/estudios')}
                            style={{
                                marginTop: 16, padding: '8px 20px', borderRadius: 8,
                                background: 'var(--accent)', color: '#fff', border: 'none',
                                fontSize: 13, cursor: 'pointer',
                            }}
                        >
                            Ver estudios
                        </button>
                    </div>
                </div>
            </>
        )
    }

    return (
        <>
            <HeaderApp
                titulo={estudio.nombreArchivo}
                subtitulo={new Date(estudio.creadoEn).toLocaleDateString('es-MX', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <InformeResultado
                    informe={estudio.informe}
                    imagenDataUrl={estudio.imagenDataUrl}
                    gradcamBase64={estudio.informe.gradcamBase64}
                    onGuardar={() => router.push('/estudios')}
                    onNuevo={() => router.push('/analizar')}
                />
            </div>
        </>
    )
}
