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
                gap: 4,
                padding: '10px 14px 10px 12px',
                background: active ? 'var(--accent-glow)' : 'transparent',
                border: 'none',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--ta)',
            }}
            onMouseEnter={e => {
                if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)'
                }
            }}
            onMouseLeave={e => {
                if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{
                    fontSize: 11.5,
                    fontWeight: active ? 500 : 400,
                    color: active ? 'var(--t0)' : 'var(--t1)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    letterSpacing: '-0.01em',
                }}>
                    {chat.title}
                </span>
                <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 8.5,
                    color: 'var(--t2)',
                    flexShrink: 0,
                    letterSpacing: '0.03em',
                }}>
                    {date}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 8.5,
                    color: 'var(--t2)',
                    letterSpacing: '0.04em',
                }}>
                    {chat.messageCount} {chat.messageCount === 1 ? 'msg' : 'msgs'}
                </span>
                {chat.patientId && (
                    <>
                        <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--t3)', display: 'inline-block' }} />
                        <span style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 8.5,
                            color: active ? 'var(--accent)' : 'var(--t2)',
                            letterSpacing: '0.04em',
                        }}>
                            PAC-{chat.patientId}
                        </span>
                    </>
                )}
            </div>
        </button>
    )
}