import type { ProgressEntry } from '../types';

const BASE = 'http://localhost:3001/api';

export async function getProgress(courseId: string): Promise<ProgressEntry[]> {
  const res = await fetch(`${BASE}/progress/${courseId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveProgress(
  courseId: string,
  lessonId: string,
  completed: boolean,
  notes?: string
): Promise<void> {
  await fetch(`${BASE}/progress/${courseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonId, completed, notes }),
  });
}
