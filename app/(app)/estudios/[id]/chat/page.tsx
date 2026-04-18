'use client'

// Chat clínico dedicado para un estudio.
// Vista expandida del chat — alternativa a la burbuja flotante.

import { useParams } from 'next/navigation'
import { HeaderApp } from '@/components/layout/header-app'
import { ChatView } from '@/features/chat-clinico'

export default function ChatEstudioPage() {
    const params = useParams()
    const estudioId = typeof params.id === 'string' ? params.id : undefined

    return (
        <>
            <HeaderApp titulo="Chat clínico" subtitulo="Consulta sobre el estudio" />
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatView estudioIdInicial={estudioId} />
            </div>
        </>
    )
}