import Anthropic from '@anthropic-ai/sdk';
import type { Curriculum, Lesson } from '../types.js';

let client: Anthropic;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}
const MODEL = 'claude-opus-4-6';

const SYSTEM_PROMPT =
  'You are an expert programming teacher who teaches developers their next technology by mapping it to what they already know. Always output valid JSON only, with no markdown fences or extra text.';

export async function generateCurriculum(knownTech: string, targetTech: string): Promise<Curriculum> {
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a curriculum teaching ${targetTech} to someone who already knows ${knownTech}. Include 4-6 modules, each with 3-5 lessons. Output JSON matching this exact schema:
{
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
}`,
      },
    ],
  });

  const response = await stream.finalMessage();
  const text = response.content.find((b) => b.type === 'text')?.text ?? '';
  return JSON.parse(text) as Curriculum;
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
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate full lesson content for: "${lessonTitle}" in a course teaching ${targetTech} to someone who knows ${knownTech}.

Output JSON matching this exact schema:
{
  "id": "string (uuid)",
  "title": "string",
  "explanation": "string (markdown, 2-4 paragraphs explaining the concept and how it maps from ${knownTech} to ${targetTech})",
  "knownWayCode": "string (code example showing the ${knownTech} approach)",
  "targetWayCode": "string (code example showing the ${targetTech} approach)",
  "exercise": "string (markdown, a hands-on exercise prompt)",
  "starterCode": "string (starter code for the exercise)",
  "solutionCode": "string (complete solution)",
  "language": "string (typescript | javascript | python)"
}`,
      },
    ],
  });

  const response = await stream.finalMessage();
  const text = response.content.find((b) => b.type === 'text')?.text ?? '';
  return JSON.parse(text) as Lesson;
}
