import {
  MOCK_COPILOT_CONVERSATIONS,
  MOCK_COPILOT_MESSAGES,
  MOCK_COPILOT_SUGGESTIONS,
  type CopilotSuggestion,
} from '../../../../services/mock-copilot-service'
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
} from './copilot-icons'

const SUGGESTION_ICONS = {
  chart: ChartIcon,
  building: BuildingIcon,
  compare: CompareIcon,
  document: DocumentIcon,
} as const

function SuggestionCard({ suggestion }: { suggestion: CopilotSuggestion }) {
  const Icon = SUGGESTION_ICONS[suggestion.icon]

  return (
    <button
      type="button"
      className="flex items-start gap-3 rounded-2xl border border-[#D7E8F0] bg-[#EEF6FA] px-4 py-3.5 text-left transition-colors hover:bg-[#E4F1F7]"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-relaive-primary shadow-sm">
        <Icon className="text-relaive-primary" />
      </span>
      <span className="text-sm font-medium leading-snug text-[#1C2A38]">{suggestion.label}</span>
    </button>
  )
}

export function CopilotPage() {
  const conversations = MOCK_COPILOT_CONVERSATIONS
  const suggestions = MOCK_COPILOT_SUGGESTIONS
  const messages = MOCK_COPILOT_MESSAGES

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-0 overflow-hidden bg-white">
      {/* Conversation sidebar */}
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-3 pb-3">
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-relaive-secondary to-relaive-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            New Conversation
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  className={[
                    'flex w-full flex-col gap-0.5 rounded-xl px-3 py-2.5 text-left transition-colors',
                    conversation.active
                      ? 'bg-[#E8F0F5]'
                      : 'hover:bg-black/5',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {conversation.pinned && (
                        <PinIcon className="shrink-0 text-relaive-primary" />
                      )}
                      <span className="truncate text-sm font-semibold text-relaive-navy">
                        {conversation.title}
                      </span>
                    </div>
                    <span className="shrink-0 text-[11px] text-relaive-gray">
                      {conversation.timestamp}
                    </span>
                  </div>
                  <p className="truncate pl-[22px] text-xs text-relaive-gray">
                    {conversation.snippet}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto border-t border-black/5 px-2 py-2">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-relaive-navy transition-colors hover:bg-black/5"
          >
            <HistoryIcon className="text-relaive-gray" />
            Conversation History
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-relaive-navy transition-colors hover:bg-black/5"
          >
            <ExportIcon className="text-relaive-gray" />
            Export Conversation
          </button>
        </div>
      </aside>

      {/* Chat area */}
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
                Online · GPT-4 powered
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-relaive-secondary to-relaive-primary text-white">
                    <SparkleIcon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="rounded-2xl rounded-tl-md bg-[#F1F3F5] px-4 py-3 text-sm leading-relaxed text-[#1C2A38]">
                      {message.content}
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Copy message"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                      >
                        <CopyIcon />
                      </button>
                      <button
                        type="button"
                        aria-label="Thumbs up"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                      >
                        <ThumbsUpIcon />
                      </button>
                      <button
                        type="button"
                        aria-label="Thumbs down"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                      >
                        <ThumbsDownIcon />
                      </button>
                      <button
                        type="button"
                        aria-label="Regenerate"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                      >
                        <RefreshIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                readOnly
              />
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Attach file"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                >
                  <PaperclipIcon />
                </button>
                <button
                  type="button"
                  aria-label="Attach image"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                >
                  <ImageIcon />
                </button>
                <button
                  type="button"
                  aria-label="Voice input"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-relaive-gray transition-colors hover:bg-black/5 hover:text-relaive-navy"
                >
                  <MicIcon />
                </button>
                <button
                  type="button"
                  aria-label="Send message"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-relaive-secondary to-relaive-primary text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
            <p className="mt-2.5 text-center text-[11px] text-relaive-gray">
              AI Copilot can make mistakes. Always verify important valuations with a qualified
              professional.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
