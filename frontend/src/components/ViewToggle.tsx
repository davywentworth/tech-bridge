export type ViewMode = 'sidebyside' | 'sequential';

interface Props {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 4, border: '1px solid #e5e7eb', borderRadius: 8, padding: 3 }}>
      {(['sidebyside', 'sequential'] as ViewMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: '5px 14px',
            fontSize: 13,
            fontWeight: 500,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            background: mode === m ? '#2563eb' : 'transparent',
            color: mode === m ? '#fff' : '#374151',
            fontFamily: 'inherit',
          }}
        >
          {m === 'sidebyside' ? 'Side by Side' : 'Sequential'}
        </button>
      ))}
    </div>
  );
}
