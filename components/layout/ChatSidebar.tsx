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
                width: open ? 280 : 0,
                flexShrink: 0,
                transition: 'width var(--ts)',
            }}
        >
            <div style={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Cabecera */}
                <div
                    style={{
                        padding: '16px 14px 12px',
                        borderBottom: '1px solid var(--border)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t0)' }}>Sesiones</div>
                        <div
                            style={{
                                fontFamily: 'var(--mono)',
                                fontSize: 9,
                                color: 'var(--t2)',
                                marginTop: 2,
                                letterSpacing: '0.08em',
                            }}
                        >
                            Carcinoma pulmonar · IA
                        </div>
                    </div>

                    {/* Boton nueva sesion */}
                    <button
                        onClick={onNewChat}
                        title="Nueva sesion"
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--r6)',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            cursor: 'pointer',
                            color: 'var(--t2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all var(--ta)',
                        }}
                        onMouseEnter={e => {
                            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
                            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(91,107,240,0.4)'
                        }}
                        onMouseLeave={e => {
                            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--t2)'
                            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                        }}
                    >
                        {/* Icono + */}
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Lista de chats */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {chats.length === 0 ? (
                        <div
                            style={{
                                padding: '24px 14px',
                                fontFamily: 'var(--mono)',
                                fontSize: 10,
                                color: 'var(--t2)',
                                textAlign: 'center',
                                lineHeight: 1.8,
                            }}
                        >
                            Sin sesiones previas.
                            <br />
                            Crea una nueva para empezar.
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

                <div
                    style={{
                        padding: '10px 14px',
                        borderTop: '1px solid var(--border)',
                        fontFamily: 'var(--mono)',
                        fontSize: 9,
                        color: 'var(--t3)',
                        textAlign: 'center',
                    }}
                >
                    Sistema IA · Carcinoma Pulmonar
                </div>
            </div>
        </aside>
    )
}