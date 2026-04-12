'use client'

// Pantalla principal: subir radiografía → ver informe → guardar estudio.
// Este es el punto de entrada de la app clínica. El chat queda como burbuja
// flotante disponible en cualquier momento desde la esquina inferior.

import { HeaderApp } from '@/components/layout/header-app'
import { ZonaSubida, InformeResultado, useAnalisis } from '@/features/analisis'
import { useEstudios } from '@/features/estudios'
import { usePlan } from '@/components/plan'
import { useRouter } from 'next/navigation'

export default function AnalizarPage() {
    const { estado, analizar, reiniciar } = useAnalisis()
    const { guardar, puedoCrear, estudiosEsteMes } = useEstudios()
    const { limites } = usePlan()
    const router = useRouter()

    function handleGuardar() {
        if (estado.paso !== 'completado') return
        const estudio = guardar({
            imagenDataUrl: estado.imagenDataUrl,
            nombreArchivo: estado.nombreArchivo,
            mimeType: estado.mimeType,
            informe: estado.informe,
        })
        router.push(`/estudios/${estudio.id}`)
    }

    return (
        <>
            <HeaderApp
                titulo="Analizar radiografía"
                subtitulo={
                    limites.estudiosPorMes !== null
                        ? `${estudiosEsteMes}/${limites.estudiosPorMes} este mes`
                        : undefined
                }
            />
            <div style={{
                flex: 1, overflowY: 'auto', padding: '32px 24px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
                {estado.paso === 'idle' && (
                    <ZonaSubida
                        onArchivo={analizar}
                        disabled={!puedoCrear}
                    />
                )}

                {(estado.paso === 'subiendo' || estado.paso === 'analizando') && (
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 16, padding: '64px 24px',
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: '50%',
                            border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                        <div style={{ fontSize: 14, color: 'var(--t1)' }}>
                            {estado.paso === 'subiendo' ? 'Subiendo imagen...' : 'Analizando con el modelo...'}
                        </div>
                        <div style={{
                            fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--t2)',
                        }}>
                            {estado.nombreArchivo}
                        </div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {estado.paso === 'completado' && (
                    <InformeResultado
                        informe={estado.informe}
                        imagenDataUrl={estado.imagenDataUrl}
                        gradcamBase64={estado.informe.gradcamBase64}
                        onGuardar={handleGuardar}
                        onNuevo={reiniciar}
                    />
                )}

                {estado.paso === 'error' && (
                    <div style={{
                        textAlign: 'center', padding: '48px 24px',
                        maxWidth: 400,
                    }}>
                        <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
                        <div style={{ fontSize: 14, color: 'var(--err)', marginBottom: 16 }}>
                            {estado.mensaje}
                        </div>
                        <button
                            onClick={reiniciar}
                            style={{
                                padding: '10px 24px', borderRadius: 10,
                                background: 'var(--bg-3)', color: 'var(--t0)',
                                border: '1px solid var(--border)', fontSize: 13,
                                cursor: 'pointer',
                            }}
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {!puedoCrear && estado.paso === 'idle' && (
                    <div style={{
                        marginTop: 16, padding: '12px 16px', borderRadius: 10,
                        border: '1px solid var(--warn)', background: 'var(--warn-bg)',
                        color: 'var(--warn)', fontSize: 13, textAlign: 'center',
                        maxWidth: 420,
                    }}>
                        Has alcanzado el límite de {limites.estudiosPorMes} estudios/mes.
                        <a href="/upgrade" style={{ color: 'var(--accent)', marginLeft: 6 }}>
                            Actualizar plan →
                        </a>
                    </div>
                )}
            </div>
        </>
    )
}
