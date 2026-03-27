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
  "explanation": "string (markdown; length should match concept complexity — one tight paragraph for simple concepts, up to 4 paragraphs for nuanced ones; always map from ${knownTech} to ${targetTech})",
  "knownWayCode": "string (code example showing the ${knownTech} approach)",
  "targetWayCode": "string (code example showing the ${targetTech} approach)",
  "hasExercise": "boolean (true if a meaningful hands-on exercise is included; false if the concept is too simple, too abstract, or the exercise would just repeat the code comparison above)",
  "exercise": "string (markdown hands-on exercise prompt, or empty string if hasExercise is false)",
  "starterCode": "string (starter code for the exercise, or empty string if hasExercise is false)",
  "solutionCode": "string (complete solution, or empty string if hasExercise is false)",
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
            text: `Generate a curriculum teaching ${targetTech} to someone who already knows ${knownTech}.

Structure the curriculum based on the complexity of the topic:
- Simple migrations or incremental upgrades: 2-3 modules, 2-4 lessons each
- Moderate topics: 3-5 modules, 3-5 lessons each
- Complex new paradigms: 4-6 modules, 4-6 lessons each

Use your judgment — don't pad with unnecessary modules or lessons if the topic doesn't warrant them.`,
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
            text: `Generate full lesson content for: "${lessonTitle}" in a course teaching ${targetTech} to someone who knows ${knownTech}.

For the exercise: include one if there's a meaningful hands-on task the learner can complete independently. A good exercise asks the learner to write new code or adapt a pattern — not just copy the example above.

Skip the exercise (set hasExercise to false, leave exercise/starterCode/solutionCode as empty strings) if:
- The concept is purely conceptual or philosophical (e.g. "why X exists")
- The exercise would be trivially obvious (e.g. "change the variable name")
- It would just repeat the code comparison with no added learning value`,
          },
        ],
      },
    ],
  })

  const response = await stream.finalMessage()
  const text = response.content.find((b) => b.type === 'text')?.text ?? ''
  return JSON.parse(text) as Lesson
}
