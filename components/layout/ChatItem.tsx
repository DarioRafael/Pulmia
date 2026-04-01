'use client'

import { Chat } from '@/lib/types'

interface ChatItemProps {
    chat: Chat
    active: boolean
    onClick: (id: string) => void
}

export function ChatItem({ chat, active, onClick }: ChatItemProps) {
    const date = chat.updatedAt.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
    })

    return (
        <button
            onClick={() => onClick(chat.id)}
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                padding: '10px 14px',
                background: active ? 'rgba(91,107,240,0.08)' : 'transparent',
                border: 'none',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--ta)',
            }}
            onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-2)'
            }}
            onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                }}
            >
        <span
            style={{
                fontSize: 12,
                fontWeight: 500,
                color: active ? 'var(--t0)' : 'var(--t1)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
            }}
        >
          {chat.title}
        </span>
                <span
                    style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 9,
                        color: 'var(--t2)',
                        flexShrink: 0,
                    }}
                >
          {date}
        </span>
            </div>

            <span
                style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 9,
                    color: 'var(--t2)',
                    letterSpacing: '0.04em',
                }}
            >
        {chat.messageCount} {chat.messageCount === 1 ? 'mensaje' : 'mensajes'}
                {chat.patientId ? ` · Paciente ${chat.patientId}` : ''}
      </span>
        </button>
    )
}