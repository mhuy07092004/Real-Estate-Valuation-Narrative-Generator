import { callGroqChat } from './groq.service.js'
import { REPORT_PROMPTS, type NarrativeContext, type ReportType } from './narrative-prompts.js'

// Generates the appraisal narrative for a given report type by calling Groq
// with a type-specific system prompt (see narrative-prompts.ts).
export async function generateNarrative(
  reportType: ReportType,
  context: NarrativeContext,
): Promise<string> {
  const prompt = REPORT_PROMPTS[reportType]

  return callGroqChat(
    [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: prompt.buildUserMessage(context) },
    ],
    { temperature: prompt.temperature },
  )
}
