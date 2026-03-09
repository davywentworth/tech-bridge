import type { ExecuteResult } from '../types'

interface Props {
  result: ExecuteResult
}

export function OutputPanel({ result }: Props) {
  const hasOutput = result.stdout || result.stderr
  return (
    <div
      style={{
        background: '#0d1117',
        borderRadius: '0 0 8px 8px',
        padding: '10px 14px',
        minHeight: 60,
      }}
    >
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontFamily: 'monospace' }}>
        Output — exit code: {result.exitCode}
      </div>
      {!hasOutput && (
        <span style={{ fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>No output</span>
      )}
      {result.stdout && (
        <pre
          style={{
            margin: 0,
            fontSize: 13,
            color: '#e5e7eb',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          {result.stdout}
        </pre>
      )}
      {result.stderr && (
        <pre
          style={{
            margin: 0,
            fontSize: 13,
            color: '#f87171',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          {result.stderr}
        </pre>
      )}
    </div>
  )
}
