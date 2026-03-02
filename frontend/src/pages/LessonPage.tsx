import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import type { Curriculum, Lesson } from '../types';
import { generateLesson } from '../api/course';
import { CurriculumView } from '../components/CurriculumView';
import { LessonView } from '../components/LessonView';
import { useProgress } from '../hooks/useProgress';

export function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { curriculum?: Curriculum; lessonTitle?: string } | null;

  const curriculum: Curriculum | null = state?.curriculum ?? null;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isCompleted, markComplete } = useProgress(courseId);

  useEffect(() => {
    if (!curriculum || !state?.lessonTitle) return;
    setLoading(true);
    setError(null);
    generateLesson(curriculum.knownTech, curriculum.targetTech, state.lessonTitle)
      .then(setLesson)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const completedIds = curriculum?.modules
    .flatMap((m) => m.lessons.map((l) => l.id))
    .filter((id) => isCompleted(id)) ?? [];

  function handleSelectLesson(_moduleId: string, nextLessonId: string, lessonTitle: string) {
    navigate(`/curriculum/${courseId}/lesson/${nextLessonId}`, {
      state: { curriculum, lessonTitle },
    });
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {curriculum && (
        <CurriculumView
          curriculum={curriculum}
          currentLessonId={lessonId}
          completedLessonIds={completedIds}
          onSelectLesson={handleSelectLesson}
        />
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: 40, color: '#6b7280' }}>
            Generating lesson content…
          </div>
        )}
        {error && (
          <div style={{ padding: 40, color: '#c0392b' }}>Error: {error}</div>
        )}
        {lesson && curriculum && (
          <LessonView
            lesson={lesson}
            knownTech={curriculum.knownTech}
            targetTech={curriculum.targetTech}
            isCompleted={isCompleted(lessonId ?? '')}
            onMarkComplete={(completed) => markComplete(lessonId ?? '', completed)}
          />
        )}
      </div>
    </div>
  );
}
