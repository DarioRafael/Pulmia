'use client'

import { useState, useCallback, useEffect } from 'react'
import { Rail } from '@/components/layout/Rail'
import { ChatSidebar } from '@/components/layout/ChatSidebar'
import { MessageList } from '@/components/chat/MessageList'
import { InputBar } from '@/components/chat/InputBar'
import { SearchBar } from '@/components/ui/SearchBar'
import { Toast, useToast } from '@/components/ui/Toast'
import { useChat } from '@/lib/hooks/useChat'
import { streamChat } from '@/lib/api/chat'
import { Chat } from '@/lib/types'

function generateId() {
    return Math.random().toString(36).slice(2, 10)
}

// ── Busqueda en burbujas del DOM ──────────────────────────────────────────────
function doSearch(query: string): Element[] {
    clearSearchMarks()
    if (!query.trim()) return []
    const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const matches: Element[] = []
    document.querySelectorAll('.bubble').forEach(bubble => {
        if (!re.test(bubble.textContent || '')) return
        re.lastIndex = 0
        bubble.classList.add('search-match')
        matches.push(bubble)
        const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT, null)
        const nodes: Text[] = []
        let n: Node | null
        while ((n = walker.nextNode())) nodes.push(n as Text)
        nodes.forEach(tn => {
            re.lastIndex = 0
            if (!re.test(tn.nodeValue || '')) return
            re.lastIndex = 0
            const frag = document.createDocumentFragment()
            let last = 0
            let m: RegExpExecArray | null
            while ((m = re.exec(tn.nodeValue || '')) !== null) {
                if (m.index > last) frag.appendChild(document.createTextNode((tn.nodeValue || '').slice(last, m.index)))
                const mark = document.createElement('mark')
                mark.textContent = m[0]
                frag.appendChild(mark)
                last = m.index + m[0].length
            }
            if (last < (tn.nodeValue || '').length)
                frag.appendChild(document.createTextNode((tn.nodeValue || '').slice(last)))
            tn.parentNode?.replaceChild(frag, tn)
        })
    })
    return matches
}

function clearSearchMarks() {
    document.querySelectorAll('mark').forEach(m => {
        const p = m.parentNode
        p?.replaceChild(document.createTextNode(m.textContent || ''), m)
        ;(p as Element)?.normalize()
    })
    document.querySelectorAll('.search-match').forEach(b => b.classList.remove('search-match'))
}
// ─────────────────────────────────────────────────────────────────────────────

// ── Tipos de contenido multimodal ─────────────────────────────────────────────
type TextBlock = { type: 'text'; text: string }
type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
type ContentBlock = TextBlock | ImageBlock

type HistoryMessage = {
    role: 'user' | 'assistant'
    content: string | ContentBlock[]
}
// ─────────────────────────────────────────────────────────────────────────────

export function ChatShell() {
    const { messages, isTyping, status, setStatus, addMessage, startStream, appendChunk, endStream, showTyping, hideTyping, clearMessages } = useChat()
    const { message: toastMsg, visible: toastVisible, showToast } = useToast()

    // Layout
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)

    // Chats / sesiones
    const [chats, setChats] = useState<Chat[]>([])
    const [activeChatId, setActiveChatId] = useState<string | null>(null)

    // Busqueda
    const [searchQuery, setSearchQuery] = useState('')
    const [searchMatches, setSearchMatches] = useState<Element[]>([])
    const [searchIdx, setSearchIdx] = useState(0)

    // Estado de conexion con el backend
    const [statusKey, setStatusKey] = useState<'idle' | 'thinking' | 'online'>('idle')

    // ── Keyboard shortcut Ctrl+F ────────────────────────────────────────────────
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault()
                setSearchOpen(v => !v)
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [])

    // ── Busqueda ────────────────────────────────────────────────────────────────
    function handleSearchQuery(q: string) {
        setSearchQuery(q)
        const matches = doSearch(q)
        setSearchMatches(matches)
        setSearchIdx(0)
        if (matches.length > 0) matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    function handleSearchNext() {
        if (!searchMatches.length) return
        const next = (searchIdx + 1) % searchMatches.length
        setSearchIdx(next)
        searchMatches[next].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    function handleSearchPrev() {
        if (!searchMatches.length) return
        const prev = (searchIdx - 1 + searchMatches.length) % searchMatches.length
        setSearchIdx(prev)
        searchMatches[prev].scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    function handleCloseSearch() {
        setSearchOpen(false)
        clearSearchMarks()
        setSearchQuery('')
        setSearchMatches([])
        setSearchIdx(0)
    }

    // ── Chats / sesiones ────────────────────────────────────────────────────────
    function handleNewChat() {
        const id = generateId()
        const chat: Chat = {
            id,
            title: `Sesion ${chats.length + 1}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            messageCount: 0,
        }
        setChats(prev => [chat, ...prev])
        setActiveChatId(id)
        clearMessages()
        showToast('Nueva sesion creada')
    }

    function handleSelectChat(id: string) {
        if (id === activeChatId) return
        setActiveChatId(id)
        clearMessages()
        // Aqui se cargara el historial del chat desde el backend cuando se integre
        showToast('Sesion cargada')
    }

    // ── Helpers para construir content multimodal ────────────────────────────────
    function buildContentWithImage(text: string, base64: string, mime: string): ContentBlock[] {
        const blocks: ContentBlock[] = [
            {
                type: 'image',
                source: { type: 'base64', media_type: mime, data: base64 },
            },
        ]
        if (text.trim()) blocks.push({ type: 'text', text })
        return blocks
    }

    function extractBase64FromDataUrl(dataUrl: string): { data: string; mime: string } {
        const [header, data] = dataUrl.split(',')
        const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
        return { data, mime }
    }

    // ── Enviar mensaje ──────────────────────────────────────────────────────────
    function handleSend(text: string, imageB64?: string, imageMime?: string) {
        if (!text.trim() && !imageB64) return

        // Mostrar mensaje del usuario inmediatamente en la UI
        addMessage('user', text, imageB64 ? `data:${imageMime};base64,${imageB64}` : undefined)

        setStatusKey('thinking')
        showTyping()

        // Actualizar conteo de mensajes en el chat activo
        if (activeChatId) {
            setChats(prev =>
                prev.map(c =>
                    c.id === activeChatId
                        ? { ...c, messageCount: c.messageCount + 1, updatedAt: new Date(), title: c.messageCount === 0 && text ? text.slice(0, 40) : c.title }
                        : c
                )
            )
        }

        // ── Construir historial multimodal para la API ──────────────────────────
        const history: HistoryMessage[] = messages
            .filter(m => !m.isStreaming)
            .map(m => {
                // Si el mensaje tiene imagen adjunta, construir content multimodal
                if (m.imageDataUrl) {
                    const { data, mime } = extractBase64FromDataUrl(m.imageDataUrl)
                    return {
                        role: m.role as 'user' | 'assistant',
                        content: buildContentWithImage(m.content, data, mime),
                    }
                }
                return {
                    role: m.role as 'user' | 'assistant',
                    content: m.content,
                }
            })

        // Agregar el mensaje actual (con imagen si la hay)
        if (imageB64 && imageMime) {
            history.push({
                role: 'user',
                content: buildContentWithImage(text, imageB64, imageMime),
            })
        } else {
            history.push({ role: 'user', content: text || '(imagen adjunta)' })
        }
        // ───────────────────────────────────────────────────────────────────────

        let isStreamStarted = false

        streamChat(history, {
            onChunk: (chunk) => {
                if (!isStreamStarted) {
                    hideTyping()
                    startStream()
                    isStreamStarted = true
                }
                appendChunk(chunk)
            },
            onDone: () => {
                endStream()
                setStatusKey('online')
            },
            onError: (err) => {
                hideTyping()
                endStream()
                setStatusKey('idle')
                showToast(`Error: ${err.message}`)
            },
        })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100vw', height: '100vh' }}>

            {/* Rail lateral de iconos */}
            <Rail
                onToggleSidebar={() => setSidebarOpen(v => !v)}
                onToggleSearch={() => setSearchOpen(v => !v)}
                sidebarOpen={sidebarOpen}
                searchOpen={searchOpen}
                statusKey={statusKey}
            />

            {/* Panel lateral de sesiones / chats por paciente */}
            <ChatSidebar
                open={sidebarOpen}
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
            />

            {/* Area principal de chat */}
            <main
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    overflow: 'hidden',
                    background: 'var(--bg-0)',
                    flex: 1,
                    minWidth: 0,
                    position: 'relative',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0 16px',
                        height: 52,
                        flexShrink: 0,
                        borderBottom: '1px solid var(--border)',
                        background: 'rgba(11,13,22,0.94)',
                        backdropFilter: 'blur(12px)',
                        position: 'relative',
                        zIndex: 10,
                    }}
                >
                    {/* Avatar / indicador del sistema */}
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-d))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        }}
                    >
                        {/* Icono de pulmon / medico minimalista */}
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path
                                d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                                stroke="white"
                                strokeWidth="1.3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'var(--ok)',
                                border: '2px solid var(--bg-0)',
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                            }}
                        />
                    </div>

                    {/* Nombre y estado */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t0)' }}>
                            Sistema IA
                        </div>
                        <div
                            style={{
                                fontFamily: 'var(--mono)',
                                fontSize: 9,
                                color: 'var(--t2)',
                                letterSpacing: '0.06em',
                            }}
                        >
                            {status}
                        </div>
                    </div>

                    {/* Badge de contexto */}
                    <span
                        style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 8,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            padding: '2px 9px',
                            borderRadius: 'var(--r4)',
                            border: '1px solid rgba(91,107,240,0.3)',
                            background: 'rgba(91,107,240,0.07)',
                            color: 'var(--accent)',
                            cursor: 'default',
                            whiteSpace: 'nowrap',
                        }}
                    >
            carcinoma pulmonar
          </span>

                    <div style={{ flex: 1 }} />

                    {/* Boton buscar en header */}
                    <button
                        onClick={() => setSearchOpen(v => !v)}
                        title="Buscar (Ctrl+F)"
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 'var(--r6)',
                            background: searchOpen ? 'rgba(91,107,240,0.1)' : 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: searchOpen ? 'var(--accent)' : 'var(--t2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all var(--ta)',
                        }}
                    >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
                            <line x1="9.5" y1="9.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                    </button>

                    {/* Barra de busqueda superpuesta */}
                    <SearchBar
                        open={searchOpen}
                        query={searchQuery}
                        matchCount={searchMatches.length}
                        currentMatch={searchIdx}
                        onQueryChange={handleSearchQuery}
                        onNext={handleSearchNext}
                        onPrev={handleSearchPrev}
                        onClose={handleCloseSearch}
                    />
                </div>

                {/* Lista de mensajes */}
                <MessageList messages={messages} isTyping={isTyping} />

                {/* Barra de entrada */}
                <InputBar onSend={handleSend} disabled={isTyping} />
            </main>

            {/* Toast global */}
            <Toast message={toastMsg} visible={toastVisible} />

            {/* Estilos de animacion inyectados inline para no depender de un archivo CSS extra */}
            <style>{`
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes t-bounce {
          0%, 60%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          30%            { transform: translateY(-5px) scale(1.15); opacity: 1; }
        }
        @keyframes mic-pulse {
          0%   { transform: scale(0.7); opacity: 0.7; }
          100% { transform: scale(2);   opacity: 0;   }
        }
        .msg-wrap:hover .copy-btn { opacity: 1 !important; }
        .msg-wrap:hover .msg-ts   { opacity: 1 !important; }
      `}</style>
        </div>
    )
}