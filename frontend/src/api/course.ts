import type { Curriculum } from '../types';

const BASE = 'http://localhost:3001/api';

export async function generateCourse(knownTech: string, targetTech: string): Promise<Curriculum> {
  const res = await fetch(`${BASE}/course/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ knownTech, targetTech }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCourse(id: string): Promise<Curriculum> {
  const res = await fetch(`${BASE}/course/${id}`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.curriculum ?? data;
}

export async function generateLesson(
  knownTech: string,
  targetTech: string,
  lessonTitle: string
) {
  const res = await fetch(`${BASE}/lesson/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ knownTech, targetTech, lessonTitle }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
