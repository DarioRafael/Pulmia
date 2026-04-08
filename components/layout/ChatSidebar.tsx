'use client'

import { Chat } from '@/lib/types'
import { ChatItem } from './ChatItem'

interface ChatSidebarProps {
    open: boolean
    chats: Chat[]
    activeChatId: string | null
    onSelectChat: (id: string) => void
    onNewChat: () => void
}

export function ChatSidebar({ open, chats, activeChatId, onSelectChat, onNewChat }: ChatSidebarProps) {
    return (
        <aside
            style={{
                background: 'var(--bg-1)',
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                width: open ? 272 : 0,
                flexShrink: 0,
                transition: 'width var(--ts)',
            }}
        >
            <div style={{ width: 272, height: '100%', display: 'flex', flexDirection: 'column' }}>

                {/* Cabecera */}
                <div
                    style={{
                        padding: '14px 14px 12px',
                        borderBottom: '1px solid var(--border)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                    }}
                >
                    <div>
                        <div style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: 'var(--t0)',
                            letterSpacing: '-0.01em',
                        }}>
                            Sesiones clínicas
                        </div>
                    </div>

                    <button
                        onClick={onNewChat}
                        title="Nueva sesión"
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: 'var(--r6)',
                            background: 'transparent',
                            border: '1px solid var(--border-h)',
                            cursor: 'pointer',
                            color: 'var(--t2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all var(--ta)',
                        }}
                        onMouseEnter={e => {
                            const el = e.currentTarget as HTMLButtonElement
                            el.style.color = 'var(--accent-h)'
                            el.style.borderColor = 'var(--border-focus)'
                            el.style.background = 'var(--accent-glow)'
                        }}
                        onMouseLeave={e => {
                            const el = e.currentTarget as HTMLButtonElement
                            el.style.color = 'var(--t2)'
                            el.style.borderColor = 'var(--border-h)'
                            el.style.background = 'transparent'
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <line x1="6" y1="1.5" x2="6" y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="1.5" y1="6" x2="10.5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Lista */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {chats.length === 0 ? (
                        <div style={{
                            padding: '32px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                border: '1px solid var(--border-h)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--t2)',
                            }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 3v5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
                                </svg>
                            </div>
                            <div style={{
                                fontFamily: 'var(--mono)',
                                fontSize: 9,
                                color: 'var(--t2)',
                                textAlign: 'center',
                                lineHeight: 1.9,
                                letterSpacing: '0.05em',
                            }}>
                                SIN SESIONES PREVIAS
                                <br />
                                <span style={{ color: 'var(--t3)' }}>Crea una nueva para empezar</span>
                            </div>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <ChatItem
                                key={chat.id}
                                chat={chat}
                                active={chat.id === activeChatId}
                                onClick={onSelectChat}
                            />
                        ))
                    )}
                </div>
            </div>
        </aside>
    )
}