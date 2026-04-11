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
            let last = 0; let m: RegExpExecArray | null
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

type TextBlock = { type: 'text'; text: string }
type ImageBlock = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
type ContentBlock = TextBlock | ImageBlock
type HistoryMessage = { role: 'user' | 'assistant'; content: string | ContentBlock[] }

export function ChatShell() {
    const { messages, isTyping, status, setStatus, addMessage, startStream, appendChunk, endStream, attachGradcam, showTyping, hideTyping, clearMessages } = useChat()
    const { message: toastMsg, visible: toastVisible, showToast } = useToast()

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [chats, setChats] = useState<Chat[]>([])
    const [activeChatId, setActiveChatId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchMatches, setSearchMatches] = useState<Element[]>([])
    const [searchIdx, setSearchIdx] = useState(0)
    const [statusKey, setStatusKey] = useState<'idle' | 'thinking' | 'online'>('idle')

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'f') { e.preventDefault(); setSearchOpen(v => !v) }
        }
        document.addEventListener('keydown', h)
        return () => document.removeEventListener('keydown', h)
    }, [])

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

    function handleNewChat() {
        const id = generateId()
        const chat: Chat = {
            id, title: `Sesión ${chats.length + 1}`,
            createdAt: new Date(), updatedAt: new Date(), messageCount: 0,
        }
        setChats(prev => [chat, ...prev])
        setActiveChatId(id)
        clearMessages()
        showToast('Nueva sesión creada')
    }

    function handleSelectChat(id: string) {
        if (id === activeChatId) return
        setActiveChatId(id)
        clearMessages()
        showToast('Sesión cargada')
    }

    function buildContentWithImage(text: string, base64: string, mime: string): ContentBlock[] {
        const blocks: ContentBlock[] = [{ type: 'image', source: { type: 'base64', media_type: mime, data: base64 } }]
        if (text.trim()) blocks.push({ type: 'text', text })
        return blocks
    }

    function extractBase64FromDataUrl(dataUrl: string): { data: string; mime: string } {
        const [header, data] = dataUrl.split(',')
        const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg'
        return { data, mime }
    }

    function handleSend(text: string, imageB64?: string, imageMime?: string) {
        if (!text.trim() && !imageB64) return

        addMessage('user', text, imageB64 ? `data:${imageMime};base64,${imageB64}` : undefined)
        setStatusKey('thinking')
        showTyping()

        if (activeChatId) {
            setChats(prev => prev.map(c =>
                c.id === activeChatId
                    ? { ...c, messageCount: c.messageCount + 1, updatedAt: new Date(), title: c.messageCount === 0 && text ? text.slice(0, 40) : c.title }
                    : c
            ))
        }

        const history: HistoryMessage[] = messages.filter(m => !m.isStreaming).map(m => {
            if (m.imageDataUrl) {
                const { data, mime } = extractBase64FromDataUrl(m.imageDataUrl)
                return { role: m.role as 'user' | 'assistant', content: buildContentWithImage(m.content, data, mime) }
            }
            return { role: m.role as 'user' | 'assistant', content: m.content }
        })

        if (imageB64 && imageMime) {
            history.push({ role: 'user', content: buildContentWithImage(text, imageB64, imageMime) })
        } else {
            history.push({ role: 'user', content: text || '(imagen adjunta)' })
        }

        startStream()

        streamChat(history, {
            onChunk: (chunk) => {
                hideTyping()
                appendChunk(chunk)
            },
            // Grad-CAM: se adjunta al mensaje de stream actual (no crea uno nuevo)
            onGradcam: (base64) => {
                attachGradcam(`data:image/png;base64,${base64}`)
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

            <Rail
                onToggleSidebar={() => setSidebarOpen(v => !v)}
                onToggleSearch={() => setSearchOpen(v => !v)}
                sidebarOpen={sidebarOpen}
                searchOpen={searchOpen}
                statusKey={statusKey}
            />

            <ChatSidebar
                open={sidebarOpen}
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
            />

            <main style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflow: 'hidden',
                background: 'var(--bg-0)',
                flex: 1,
                minWidth: 0,
                position: 'relative',
            }}>
                <header style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '0 16px',
                    height: 50,
                    flexShrink: 0,
                    borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(16px)',
                    position: 'relative',
                    zIndex: 10,
                }}>
                    <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: 'var(--r6)',
                        flexShrink: 0,
                        background: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: 'var(--shadow-accent)',
                    }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 2V7M4 7C4 9.2 2 10 2 12H6C6 10 7 9 7 7M10 7C10 9.2 12 10 12 12H8C8 10 7 9 7 7"
                                  stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <div style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: 'var(--t0)',
                            letterSpacing: '-0.02em',
                            lineHeight: 1,
                        }}>
                            Sistema IA
                        </div>
                        <div style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 8.5,
                            color: 'var(--t2)',
                            letterSpacing: '0.06em',
                            lineHeight: 1,
                        }}>
                            {status}
                        </div>
                    </div>

                    <div style={{ flex: 1 }} />

                    <button
                        onClick={() => setSearchOpen(v => !v)}
                        title="Buscar (Ctrl+F)"
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 'var(--r6)',
                            background: searchOpen ? 'var(--accent-glow)' : 'transparent',
                            border: searchOpen ? '1px solid var(--border-focus)' : '1px solid transparent',
                            cursor: 'pointer',
                            color: searchOpen ? 'var(--accent-h)' : 'var(--t2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all var(--ta)',
                        }}
                        onMouseEnter={e => {
                            if (!searchOpen) {
                                const el = e.currentTarget as HTMLButtonElement
                                el.style.color = 'var(--t0)'
                                el.style.background = 'var(--bg-3)'
                            }
                        }}
                        onMouseLeave={e => {
                            const el = e.currentTarget as HTMLButtonElement
                            el.style.color = searchOpen ? 'var(--accent-h)' : 'var(--t2)'
                            el.style.background = searchOpen ? 'var(--accent-glow)' : 'transparent'
                        }}
                    >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
                            <line x1="9.5" y1="9.5" x2="12" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                    </button>

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
                </header>

                <MessageList messages={messages} isTyping={isTyping} />
                <InputBar onSend={handleSend} disabled={isTyping} />
            </main>

            <Toast message={toastMsg} visible={toastVisible} />

            <style>{`
                @keyframes msg-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: none; }
                }
                @keyframes t-bounce {
                    0%, 60%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
                    30%           { transform: translateY(-5px) scale(1.2); opacity: 1; }
                }
                @keyframes mic-pulse {
                    0%   { transform: scale(0.8); opacity: 0.6; }
                    100% { transform: scale(2.2); opacity: 0;   }
                }
                .msg-wrap:hover .copy-btn { opacity: 1 !important; }
                .msg-wrap:hover .msg-ts   { opacity: 1 !important; }
            `}</style>
        </div>
    )
}