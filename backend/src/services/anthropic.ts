import Anthropic from '@anthropic-ai/sdk'
import type { Curriculum, Lesson } from '../types.js'

let client: Anthropic
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}
const MODEL = 'claude-opus-4-6'

const SYSTEM_PROMPT =
  'You are an expert programming teacher who teaches developers their next technology by mapping it to what they already know. Always output valid JSON only, with no markdown fences or extra text.'

const CURRICULUM_SCHEMA = `{
  "id": "string (uuid)",
  "knownTech": "string",
  "targetTech": "string",
  "description": "string (1-2 sentences about this course)",
  "modules": [
    {
      "id": "string (uuid)",
      "title": "string",
      "lessons": [
        { "id": "string (uuid)", "title": "string" }
      ]
    }
  ]
}`

const LESSON_SCHEMA = (knownTech: string, targetTech: string) => `{
  "id": "string (uuid)",
  "title": "string",
  "explanation": "string (markdown, 2-4 paragraphs explaining the concept and how it maps from ${knownTech} to ${targetTech})",
  "knownWayCode": "string (code example showing the ${knownTech} approach)",
  "targetWayCode": "string (code example showing the ${targetTech} approach)",
  "exercise": "string (markdown, a hands-on exercise prompt)",
  "starterCode": "string (starter code for the exercise)",
  "solutionCode": "string (complete solution)",
  "language": "string (typescript | javascript | python)"
}`

export async function generateCurriculum(
  knownTech: string,
  targetTech: string
): Promise<Curriculum> {
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Output JSON matching this exact schema:\n${CURRICULUM_SCHEMA}`,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `Generate a curriculum teaching ${targetTech} to someone who already knows ${knownTech}. Include 4-6 modules, each with 3-5 lessons.`,
          },
        ],
      },
    ],
  })

  const response = await stream.finalMessage()
  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  return JSON.parse(text) as Curriculum
}

export async function generateLesson(
  knownTech: string,
  targetTech: string,
  lessonTitle: string
): Promise<Lesson> {
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Output JSON matching this exact schema:\n${LESSON_SCHEMA(knownTech, targetTech)}`,
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: `Generate full lesson content for: "${lessonTitle}" in a course teaching ${targetTech} to someone who knows ${knownTech}.`,
          },
        ],
      },
    ],
  })

  const response = await stream.finalMessage()
  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  return JSON.parse(text) as Lesson
}
