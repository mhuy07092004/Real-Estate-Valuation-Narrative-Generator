import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronRightIcon } from '../../../components/ui/navbar/dashboard-navbar-icons'
import {
  BuildingIcon,
  ChartIcon,
  CloseIcon,
  CompareIcon,
  CopyIcon,
  DocumentIcon,
  ExportIcon,
  HistoryIcon,
  ImageIcon,
  MicIcon,
  MoreIcon,
  PaperclipIcon,
  PinIcon,
  PlusIcon,
  RefreshIcon,
  SendIcon,
  SparkleIcon,
  StarIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from '../../../features/dashboard/components/copilot/copilot-icons'
import { useAsyncData } from '../../../hooks/use-async-data'
import {
  getCopilotConversations,
  getCopilotMessages,
  getCopilotSuggestions,
  type CopilotConversation,
  type CopilotSuggestion,
} from '../../../services/common'
import { CANNED_RESPONSE_DELAY_MS, generateCannedResponse } from '../../features/dashboard/components/copilot/copilot-responses'

const SUGGESTION_ICONS = {
  chart: ChartIcon,
  building: BuildingIcon,
  compare: CompareIcon,
  document: DocumentIcon,
} as const

type LocalMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

let localIdCounter = 0
function nextLocalId(prefix: string) {
  localIdCounter += 1
  return `${prefix}-${Date.now()}-${localIdCounter}`
}

const GREETING: LocalMessage = {
  id: 'greeting',
  role: 'assistant',
  content:
    "Hello! I'm your Relaive AI Copilot. I can help you analyse properties, understand market trends, generate reports, compare suburbs, and provide investment intelligence. What would you like to explore today?",
}

function SuggestionCard({ suggestion, onSelect }: { suggestion: CopilotSuggestion; onSelect: (label: string) => void }) {
  const Icon = SUGGESTION_ICONS[suggestion.icon]
  return (
    <button
      type="button"
      onClick={() => onSelect(suggestion.label)}
      className="flex items-start gap-3 rounded-2xl border border-[#D7E8F0] bg-[#EEF6FA] px-4 py-3.5 text-left transition-colors hover:bg-[#E4F1F7]"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-relaive-primary shadow-sm">
        <Icon className="text-relaive-primary" />
      </span>
      <span className="text-sm font-medium leading-snug text-[#1C2A38]">{suggestion.label}</span>
    </button>
  )
}

export function CopilotPageV2() {
  const { data: initialConversations } = useAsyncData(getCopilotConversations, [])
  const { data: suggestions } = useAsyncData(getCopilotSuggestions, [])
  const { data: initialMessages } = useAsyncData(getCopilotMessages, [])

  const [conversations, setConversations] = useState<CopilotConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, LocalMessage[]>>({})
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | undefined>>({})
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Seed local conversation/message state once real data has loaded.
  useEffect(() => {
    if (!initialConversations || conversations.length > 0) return
    setConversations(initialConversations)
    const active = initialConversations.find((c) => c.active) ?? initialConversations[0]
    if (active) setActiveConversationId(active.id)
  }, [initialConversations, conversations.length])

  useEffect(() => {
    if (!activeConversationId || !initialMessages) return
    setMessagesByConversation((current) => {
      if (current[activeConversationId]) return current
      const seeded: LocalMessage[] =
        activeConversationId === (initialConversations?.find((c) => c.active)?.id ?? initialConversations?.[0]?.id)
          ? initialMessages.map((message) => ({ id: message.id, role: message.role, content: message.content }))
          : [GREETING]
      return { ...current, [activeConversationId]: seeded }
    })
  }, [activeConversationId, initialMessages, initialConversations])

  const activeMessages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length, isTyping])

  function appendMessage(conversationId: string, message: LocalMessage) {
    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), message],
    }))
  }

  function sendMessage(rawText?: string) {
    const content = (rawText ?? input).trim()
    if (!content || !activeConversationId) return

    const conversationId = activeConversationId
    appendMessage(conversationId, { id: nextLocalId('user'), role: 'user', content })
    setInput('')
    setIsTyping(true)

    setConversations((current) =>
      current.map((c) => (c.id === conversationId ? { ...c, snippet: content, timestamp: 'Now' } : c)),
    )

    window.setTimeout(() => {
      appendMessage(conversationId, {
        id: nextLocalId('assistant'),
        role: 'assistant',
        content: generateCannedResponse(content),
      })
      setIsTyping(false)
    }, CANNED_RESPONSE_DELAY_MS)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      sendMessage()
    }
  }

  function handleNewConversation() {
    const id = nextLocalId('conversation')
    const conversation: CopilotConversation = {
      id,
      title: 'New Conversation',
      timestamp: 'Now',
      snippet: 'No messages yet',
      active: true,
    }
    setConversations((current) => [conversation, ...current.map((c) => ({ ...c, active: false }))])
    setMessagesByConversation((current) => ({ ...current, [id]: [GREETING] }))
    setActiveConversationId(id)
  }

  function handleSelectConversation(id: string) {
    setActiveConversationId(id)
    setConversations((current) => current.map((c) => ({ ...c, active: c.id === id })))
  }

  function handleCopy(message: LocalMessage) {
    navigator.clipboard?.writeText(message.content).catch(() => {})
    setCopiedId(message.id)
    window.setTimeout(() => setCopiedId((current) => (current === message.id ? null : current)), 1500)
  }

  function handleFeedback(messageId: string, value: 'up' | 'down') {
    setFeedback((current) => ({ ...current, [messageId]: current[messageId] === value ? undefined : value }))
  }

  function handleRegenerate(message: LocalMessage, index: number) {
    if (!activeConversationId) return
    const priorUser = [...activeMessages.slice(0, index)].reverse().find((m) => m.role === 'user')
    const prompt = priorUser?.content ?? message.content
    setIsTyping(true)
    window.setTimeout(() => {
      setMessagesByConversation((current) => {
        const list = current[activeConversationId] ?? []
        const next = list.map((item) =>
          item.id === message.id ? { ...item, content: generateCannedResponse(`${prompt} (regenerate)`) } : item,
        )
        return { ...current, [activeConversationId]: next }
      })
      setIsTyping(false)
    }, CANNED_RESPONSE_DELAY_MS)
  }

  function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return
    const names = Array.from(files)
      .map((file) => file.name)
      .join(', ')
    setInput((current) => (current ? `${current} [Attached: ${names}]` : `[Attached: ${names}]`))
  }

  function handleExportConversation() {
    if (!activeConversationId) return
    const conversation = conversations.find((c) => c.id === activeConversationId)
    const transcript = activeMessages
      .map((message) => `${message.role === 'user' ? 'You' : 'Copilot'}: ${message.content}`)
      .join('\n\n')
    const blob = new Blob([transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(conversation?.title ?? 'conversation').replace(/\s+/g, '-').toLowerCase()}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden bg-white">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFilesSelected(event.target.files)
          event.target.value = ''
        }}
      />

      {sidebarOpen ? (
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-black/5 bg-[#F8FAFB]">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-relaive-secondary to-relaive-primary text-white">
                <SparkleIcon className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold text-relaive-navy">AI Copilot</h2>
            </div>
            <button
              type="button"
              aria-label="Close conversation panel"
              onClick={() => setSidebarOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={handleNewConversation}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-relaive-secondary to-relaive-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <PlusIcon className="h-4 w-4" />
              New Conversation
            </button>
          </div>

          <div id="copilot-conversation-list" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            <ul className="flex flex-col gap-1">
              {conversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectConversation(conversation.id)}
                    aria-current={conversation.id === activeConversationId ? 'true' : undefined}
                    className={[
                      'flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors',
                      conversation.id === activeConversationId ? 'bg-[#E8F0F5]' : 'hover:bg-black/5',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        {conversation.pinned && <PinIcon className="shrink-0 text-relaive-primary" />}
                        <span className="truncate text-sm font-semibold text-relaive-navy">{conversation.title}</span>
                      </div>
                      <span className="shrink-0 text-[11px] text-relaive-gray">{conversation.timestamp}</span>
                    </div>
                    <p className="truncate pl-[22px] text-xs text-relaive-gray">{conversation.snippet}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto border-t border-black/5 px-2 py-2">
            <button
              type="button"
              onClick={() => {
                const list = document.getElementById('copilot-conversation-list')
                list?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-relaive-navy transition-colors hover:bg-black/5"
            >
              <HistoryIcon className="text-relaive-gray" />
              Conversation History
            </button>
            <button
              type="button"
              onClick={handleExportConversation}
              disabled={!activeConversationId}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-relaive-navy transition-colors hover:bg-black/5 disabled:opacity-50"
            >
              <ExportIcon className="text-relaive-gray" />
              Export Conversation
            </button>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          aria-label="Open conversation panel"
          onClick={() => setSidebarOpen(true)}
          className="flex w-10 shrink-0 flex-col items-center gap-1 border-r border-black/5 bg-[#F8FAFB] pt-4 text-relaive-gray transition-colors hover:text-relaive-navy"
        >
          <ChevronRightIcon />
        </button>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/5 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-relaive-secondary to-relaive-primary text-white">
              <SparkleIcon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-semibold text-relaive-navy">Relaive AI Copilot</h1>
              <p className="text-xs text-relaive-gray">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online · Demo responses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Favourite conversation"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
            >
              <StarIcon />
            </button>
            <button
              type="button"
              aria-label="More options"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
            >
              <MoreIcon />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {activeMessages.length <= 1 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(suggestions ?? []).map((suggestion) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} onSelect={(label) => sendMessage(label)} />
                ))}
              </div>
            ) : null}

            <div className="flex flex-col gap-4">
              {activeMessages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {message.role === 'assistant' ? (
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-relaive-secondary to-relaive-primary text-white">
                      <SparkleIcon className="h-4 w-4" />
                    </span>
                  ) : null}
                  <div className={`min-w-0 flex-1 ${message.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                    <div
                      className={
                        message.role === 'user'
                          ? 'max-w-[85%] rounded-2xl rounded-tr-md bg-gradient-to-br from-relaive-secondary to-relaive-primary px-4 py-3 text-sm leading-relaxed text-white'
                          : 'rounded-2xl rounded-tl-md bg-[#F1F3F5] px-4 py-3 text-sm leading-relaxed text-[#1C2A38] whitespace-pre-line'
                      }
                    >
                      {message.content}
                    </div>
                    {message.role === 'assistant' ? (
                      <div className="mt-2 flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Copy message"
                          onClick={() => handleCopy(message)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                        >
                          <CopyIcon />
                        </button>
                        <button
                          type="button"
                          aria-label="Thumbs up"
                          aria-pressed={feedback[message.id] === 'up'}
                          onClick={() => handleFeedback(message.id, 'up')}
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-black/5 ${
                            feedback[message.id] === 'up' ? 'text-relaive-secondary' : 'text-relaive-gray hover:text-relaive-navy'
                          }`}
                        >
                          <ThumbsUpIcon />
                        </button>
                        <button
                          type="button"
                          aria-label="Thumbs down"
                          aria-pressed={feedback[message.id] === 'down'}
                          onClick={() => handleFeedback(message.id, 'down')}
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-black/5 ${
                            feedback[message.id] === 'down' ? 'text-red-500' : 'text-relaive-gray hover:text-relaive-navy'
                          }`}
                        >
                          <ThumbsDownIcon />
                        </button>
                        <button
                          type="button"
                          aria-label="Regenerate"
                          onClick={() => handleRegenerate(message, index)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                        >
                          <RefreshIcon />
                        </button>
                        {copiedId === message.id ? <span className="text-xs text-relaive-secondary">Copied</span> : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {isTyping ? (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-relaive-secondary to-relaive-primary text-white">
                    <SparkleIcon className="h-4 w-4" />
                  </span>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-[#F1F3F5] px-4 py-3">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-relaive-primary/40 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-relaive-primary/40 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-relaive-primary/40 [animation-delay:300ms]" />
                  </div>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 px-5 py-4 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2 rounded-full border border-black/10 bg-[#F8F9FB] py-1.5 pl-4 pr-1.5 shadow-sm">
              <input
                type="text"
                placeholder="Ask about properties, market trends, valuations…"
                className="min-w-0 flex-1 bg-transparent text-sm text-relaive-navy outline-none placeholder:text-relaive-gray"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleInputKeyDown}
              />
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                >
                  <PaperclipIcon />
                </button>
                <button
                  type="button"
                  aria-label="Attach image"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                >
                  <ImageIcon />
                </button>
                <button
                  type="button"
                  aria-label="Voice input"
                  disabled
                  title="Voice input isn't available in this demo yet"
                  className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full text-relaive-gray/40"
                >
                  <MicIcon />
                </button>
                <button
                  type="button"
                  aria-label="Send message"
                  onClick={() => sendMessage()}
                  disabled={!input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-relaive-secondary to-relaive-primary text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
            <p className="mt-2.5 text-center text-[11px] text-relaive-gray">
              AI Copilot can make mistakes. Always verify important valuations with a qualified professional.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
