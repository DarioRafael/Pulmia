'use client'

// Chat clínico dedicado para un estudio.
// Vista expandida del chat — alternativa a la burbuja flotante.

import { HeaderApp } from '@/components/layout/header-app'
import { ChatView } from '@/features/chat-clinico'

export default function ChatEstudioPage() {
    return (
        <>
            <HeaderApp titulo="Chat clínico" subtitulo="Consulta sobre el estudio" />
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <ChatView />
            </div>
        </>
    )
}
