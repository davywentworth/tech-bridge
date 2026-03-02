import { Router } from 'express';
import { z } from 'zod';
import { generateCurriculum } from '../services/anthropic.js';
import { saveCourse, getCourse } from '../services/db.js';

const router = Router();

const GenerateSchema = z.object({
  knownTech: z.string().min(1),
  targetTech: z.string().min(1),
});

router.post('/generate', async (req, res) => {
  const parsed = GenerateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { knownTech, targetTech } = parsed.data;

  try {
    const curriculum = await generateCurriculum(knownTech, targetTech);
    saveCourse(curriculum.id, knownTech, targetTech, curriculum);
    res.json(curriculum);
  } catch (err) {
    console.error('Course generation error:', err);
    res.status(500).json({ error: 'Failed to generate curriculum' });
  }
});

router.get('/:id', (req, res) => {
  const row = getCourse(req.params.id);
  if (!row) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }
  res.json({
    ...row,
    curriculum: JSON.parse(row.curriculum),
  });
});

export default router;
