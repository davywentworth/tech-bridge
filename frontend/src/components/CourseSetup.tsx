import { useState, type FormEvent } from 'react'

interface Props {
  onGenerate: (knownTech: string, targetTech: string) => void
  loading: boolean
  error: string | null
}

export function CourseSetup({ onGenerate, loading, error }: Props) {
  const [knownTech, setKnownTech] = useState('Redux')
  const [targetTech, setTargetTech] = useState('Redux Toolkit')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (knownTech.trim() && targetTech.trim()) {
      onGenerate(knownTech.trim(), targetTech.trim())
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Tech Bridge</h1>
      <p style={{ color: '#666', marginBottom: 32 }}>
        Learn a new technology by mapping it to what you already know.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>I know:</span>
          <input
            value={knownTech}
            onChange={(e) => setKnownTech(e.target.value)}
            placeholder="e.g. Redux"
            style={inputStyle}
            disabled={loading}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Teach me:</span>
          <input
            value={targetTech}
            onChange={(e) => setTargetTech(e.target.value)}
            placeholder="e.g. Redux Toolkit"
            style={inputStyle}
            disabled={loading}
          />
        </label>

        {error && (
          <div
            style={{
              color: '#c0392b',
              fontSize: 13,
              padding: '8px 12px',
              background: '#fdf0ed',
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !knownTech.trim() || !targetTech.trim()}
          style={buttonStyle(loading)}
        >
          {loading ? 'Generating curriculum…' : 'Generate Curriculum →'}
        </button>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  fontSize: 15,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
  fontFamily: 'inherit',
}

const buttonStyle = (loading: boolean): React.CSSProperties => ({
  padding: '12px 20px',
  fontSize: 15,
  fontWeight: 600,
  background: loading ? '#9ca3af' : '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: loading ? 'not-allowed' : 'pointer',
  marginTop: 8,
  fontFamily: 'inherit',
})
