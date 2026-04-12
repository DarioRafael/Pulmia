'use client'

// Historial de estudios del usuario.
// Muestra los estudios visibles según el plan (Free: últimos 3).

import { HeaderApp } from '@/components/layout/header-app'
import { ListaEstudios, useEstudios } from '@/features/estudios'
import { usePlan } from '@/components/plan'
import { UpgradePrompt } from '@/components/plan'
import { useRouter } from 'next/navigation'

export default function EstudiosPage() {
    const { estudios, totalEstudios } = useEstudios()
    const { can, limites } = usePlan()
    const router = useRouter()

    const tieneHistorialLimitado = !can('historial_ilimitado') && totalEstudios > estudios.length

    return (
        <>
            <HeaderApp
                titulo="Estudios"
                subtitulo={`${totalEstudios} estudio${totalEstudios === 1 ? '' : 's'} en total`}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {tieneHistorialLimitado && (
                    <div style={{ marginBottom: 16 }}>
                        <UpgradePrompt
                            feature="historial_ilimitado"
                            mensaje={`Mostrando los últimos ${limites.estudiosEnHistorial} estudios. Actualiza para ver todo el historial.`}
                        />
                    </div>
                )}
                <ListaEstudios
                    estudios={estudios}
                    onSeleccionar={(id) => router.push(`/estudios/${id}`)}
                />
            </div>
        </>
    )
}
