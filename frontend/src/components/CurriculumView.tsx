import type { Curriculum } from '../types';

interface Props {
  curriculum: Curriculum;
  currentLessonId?: string;
  completedLessonIds: string[];
  onSelectLesson: (moduleId: string, lessonId: string, lessonTitle: string) => void;
}

export function CurriculumView({ curriculum, currentLessonId, completedLessonIds, onSelectLesson }: Props) {
  return (
    <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid #e5e7eb', height: '100vh', overflowY: 'auto', padding: '16px 0' }}>
      <div style={{ padding: '0 16px 16px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
          {curriculum.knownTech} → {curriculum.targetTech}
        </h2>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{curriculum.description}</p>
      </div>

      {curriculum.modules.map((mod) => (
        <div key={mod.id} style={{ marginBottom: 8 }}>
          <div style={{ padding: '6px 16px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {mod.title}
          </div>
          {mod.lessons.map((lesson) => {
            const isActive = lesson.id === currentLessonId;
            const isDone = completedLessonIds.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                onClick={() => onSelectLesson(mod.id, lesson.id, lesson.title)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 16px',
                  background: isActive ? '#eff6ff' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: isActive ? '#1d4ed8' : '#374151',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 14 }}>{isDone ? '✓' : '○'}</span>
                <span>{lesson.title}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
