import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Lesson } from '../types'
import type { ViewMode } from './ViewToggle'
import { ViewToggle } from './ViewToggle'
import { CodeEditor } from './CodeEditor'
import { useState } from 'react'

interface Props {
  lesson: Lesson
  knownTech: string
  targetTech: string
  isCompleted: boolean
  onMarkComplete: (completed: boolean) => void
}

export function LessonView({ lesson, knownTech, targetTech, isCompleted, onMarkComplete }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('sidebyside')

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 24,
            gap: 16,
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{lesson.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <button
              onClick={() => onMarkComplete(!isCompleted)}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: 'inherit',
                background: isCompleted ? '#16a34a' : 'transparent',
                borderColor: isCompleted ? '#16a34a' : '#d1d5db',
                color: isCompleted ? '#fff' : '#374151',
              }}
            >
              {isCompleted ? '✓ Completed' : 'Mark Complete'}
            </button>
          </div>
        </div>

        {/* Explanation */}
        <section style={{ marginBottom: 28 }}>
          <ReactMarkdown>{lesson.explanation}</ReactMarkdown>
        </section>

        {/* Code comparison */}
        {viewMode === 'sidebyside' ? (
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}
          >
            <CodeBlock
              title={`${knownTech} way`}
              code={lesson.knownWayCode}
              language={lesson.language}
            />
            <CodeBlock
              title={`${targetTech} way`}
              code={lesson.targetWayCode}
              language={lesson.language}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            <CodeBlock
              title={`The ${knownTech} way (what you know)`}
              code={lesson.knownWayCode}
              language={lesson.language}
            />
            <div
              style={{
                padding: '10px 16px',
                background: '#eff6ff',
                borderRadius: 8,
                fontSize: 13,
                color: '#1d4ed8',
              }}
            >
              ↓ In {targetTech}, this becomes:
            </div>
            <CodeBlock
              title={`The ${targetTech} way (what you're learning)`}
              code={lesson.targetWayCode}
              language={lesson.language}
            />
          </div>
        )}

        {/* Exercise */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Exercise</h2>
          <div
            style={{
              padding: '12px 16px',
              background: '#f9fafb',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            <ReactMarkdown>{lesson.exercise}</ReactMarkdown>
          </div>
          <CodeEditor lesson={lesson} />
        </section>
      </div>
    </div>
  )
}

function CodeBlock({ title, code, language }: { title: string; code: string; language: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#6b7280',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ borderRadius: 8, fontSize: 13, margin: 0 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
