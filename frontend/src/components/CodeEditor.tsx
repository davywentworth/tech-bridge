import Editor from '@monaco-editor/react';
import type { Lesson, ExecuteResult } from '../types';
import { runCode } from '../api/execute';
import { useState } from 'react';
import { OutputPanel } from './OutputPanel';

interface Props {
  lesson: Lesson;
}

export function CodeEditor({ lesson }: Props) {
  const [code, setCode] = useState(lesson.starterCode);
  const [result, setResult] = useState<ExecuteResult | null>(null);
  const [running, setRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  async function handleRun() {
    setRunning(true);
    try {
      const res = await runCode(code, lesson.language, lesson.title);
      setResult(res);
    } catch (e) {
      setResult({ stdout: '', stderr: String(e), exitCode: 1 });
    } finally {
      setRunning(false);
    }
  }

  function handleShowSolution() {
    setShowSolution(true);
    setCode(lesson.solutionCode);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#1e1e1e', borderRadius: '8px 8px 0 0' }}>
        <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>
          {lesson.language}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {!showSolution && (
            <button
              onClick={handleShowSolution}
              style={{ ...editorBtnStyle, background: '#374151' }}
            >
              Show Solution
            </button>
          )}
          <button
            onClick={handleRun}
            disabled={running}
            style={{ ...editorBtnStyle, background: running ? '#374151' : '#16a34a' }}
          >
            {running ? 'Running…' : '▶ Run'}
          </button>
        </div>
      </div>

      <Editor
        height="280px"
        language={lesson.language === 'typescript' ? 'typescript' : lesson.language === 'javascript' ? 'javascript' : 'python'}
        value={code}
        onChange={(val) => setCode(val ?? '')}
        theme="vs-dark"
        options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
      />

      {result && <OutputPanel result={result} />}
    </div>
  );
}

const editorBtnStyle: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: '#fff',
  border: 'none',
  borderRadius: 5,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
