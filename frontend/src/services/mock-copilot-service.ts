export type CopilotConversation = {
  id: string
  title: string
  timestamp: string
  snippet: string
  pinned?: boolean
  active?: boolean
}

export type CopilotSuggestion = {
  id: string
  label: string
  icon: 'chart' | 'building' | 'compare' | 'document'
}

export type CopilotMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

export const MOCK_COPILOT_CONVERSATIONS: CopilotConversation[] = [
  {
    id: 'conv-richmond',
    title: 'Richmond Market Analysis',
    timestamp: 'Today',
    snippet: 'Analysed growth trends and comparable sales…',
    pinned: true,
    active: true,
  },
]

export const MOCK_COPILOT_SUGGESTIONS: CopilotSuggestion[] = [
  {
    id: 'sug-1',
    label: 'What are the market trends in Richmond VIC?',
    icon: 'chart',
  },
  {
    id: 'sug-2',
    label: 'Explain this AI valuation for 123 Smith St',
    icon: 'building',
  },
  {
    id: 'sug-3',
    label: 'Compare Surry Hills and Newtown for investment',
    icon: 'compare',
  },
  {
    id: 'sug-4',
    label: 'Rewrite my appraisal report in formal tone',
    icon: 'document',
  },
]

export const MOCK_COPILOT_MESSAGES: CopilotMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content:
      "Hello! I'm your Relaive AI Copilot. I can help you analyse properties, understand market trends, explain valuations, and draft professional reports. What would you like to explore today?",
  },
]
