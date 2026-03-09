import type { ExecuteResult } from '../types'

const BASE = 'http://localhost:3001/api'

export async function runCode(
  code: string,
  language: 'typescript' | 'javascript' | 'python',
  lessonTitle?: string
): Promise<ExecuteResult> {
  const res = await fetch(`${BASE}/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language, lessonTitle }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
