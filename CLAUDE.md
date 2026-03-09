# Tech Bridge — CLAUDE.md

AI-powered "I Know X, Teach Me Y" learning app. Users enter two technologies (e.g. "Redux" → "Redux Toolkit") and get a Claude-generated structured curriculum with interactive lessons, side-by-side code comparisons, and an in-browser Monaco editor backed by a local code execution service.

## Project Structure

Monorepo at `/Users/davy/dev/tech-bridge/`:

- `backend/` — Express + TypeScript, port 3001
- `frontend/` — Vite + React + TypeScript, port 5173
- `.env` — `ANTHROPIC_API_KEY` (gitignored, kept server-side)

## Dev Commands

```bash
cd backend && npm run dev   # port 3001
cd frontend && npm run dev  # port 5173
```

## Environment Constraints

- Node: v21.1.0 — `better-sqlite3` **cannot** be compiled (no native builds)
- SQLite: use `node-sqlite3-wasm` (v0.8.53) — pure WASM, no native build needed

```ts
// Correct import pattern:
import sqlite3wasm from 'node-sqlite3-wasm'
const { Database } = sqlite3wasm as any
```

## Claude SDK

- Package: `@anthropic-ai/sdk` (v0.78+)
- Model: `claude-opus-4-6` with adaptive thinking + streaming
- `thinking: { type: 'adaptive' }` requires v0.78+

## LLM Integration

### Curriculum generation

- **System**: "You are an expert programming teacher who teaches developers their next technology by mapping it to what they already know. Always output valid JSON."
- **User**: "Generate a curriculum teaching `{targetTech}` to someone who already knows `{knownTech}`. Include 4-6 modules, each with 3-5 lessons. Output JSON matching the Curriculum schema."

### Lesson content generation

- **System**: Same as above.
- **User**: "Generate the full lesson content for: `{lessonTitle}` in a course teaching `{targetTech}` to someone who knows `{knownTech}`. Include side-by-side code examples showing the old way ({knownTech}) and new way ({targetTech}), a hands-on exercise with starter code and solution."

## API Routes

| Method  | Path                      | Description                 |
| ------- | ------------------------- | --------------------------- |
| POST    | `/api/course/generate`    | Generate curriculum         |
| GET     | `/api/course/:id`         | Get saved curriculum        |
| POST    | `/api/lesson/generate`    | Generate lesson content     |
| POST    | `/api/code`               | Execute code (JS/TS/Python) |
| GET/PUT | `/api/progress/:courseId` | Lesson progress             |

### Code execution request/response

```ts
// POST /api/code
body: {
  code: string
  language: 'typescript' | 'javascript' | 'python'
}
response: {
  stdout: string
  stderr: string
  exitCode: number
}
```

Executor: write to `os.tmpdir()` → spawn `node` (JS) or `tsx` (TS) → 10s timeout → clean up.

## Data Model

### `courses` table

```sql
id TEXT PRIMARY KEY,
known_tech TEXT,
target_tech TEXT,
curriculum JSON,
created_at INTEGER
```

### `progress` table

```sql
course_id TEXT,
lesson_id TEXT,
completed INTEGER,  -- 0 or 1
notes TEXT,
PRIMARY KEY (course_id, lesson_id)
```

### TypeScript types

```ts
type Curriculum = {
  id: string
  knownTech: string
  targetTech: string
  description: string
  modules: Module[]
}

type Module = {
  id: string
  title: string
  lessons: LessonMeta[]
}

type LessonMeta = { id: string; title: string }

type Lesson = {
  id: string
  title: string
  explanation: string // markdown
  knownWayCode: string // X approach
  targetWayCode: string // Y approach
  exercise: string // markdown prompt
  starterCode: string
  solutionCode: string
  language: string // 'typescript' | 'javascript' | etc.
}
```

## Source Layout

```
backend/src/
  index.ts, types.ts, logger.ts
  services/  db.ts, anthropic.ts, executor.ts
  routes/    course.ts, lesson.ts, execute.ts, progress.ts

frontend/src/
  main.tsx, App.tsx
  types/      index.ts
  api/        course.ts, execute.ts, progress.ts
  hooks/      useCourse.ts, useProgress.ts
  components/ CourseSetup, CurriculumView, LessonView, CodeEditor, OutputPanel, ViewToggle
  pages/      HomePage, CurriculumPage, LessonPage
```

## Code Style

Enforced by Prettier + ESLint with pre-commit hooks (husky + lint-staged) and CI.

### Formatting (Prettier)

- **No semicolons** (`semi: false`)
- Single quotes (`singleQuote: true`)
- 2-space indentation
- Trailing commas where valid in ES5 (`trailingComma: 'es5'`)
- Max line width: 100 characters

### Linting (ESLint)

- TypeScript strict mode + `noUnusedLocals` + `noUnusedParameters`
- Frontend: `react-hooks` + `react-refresh` rules
- Backend: node globals, no React rules
- `no-explicit-any` is **off** for `db.ts`/`db.test.ts` (required by the WASM import pattern)

### Running checks

```bash
cd frontend && npm run lint        # ESLint
cd frontend && npm run format:check  # Prettier check
cd backend && npm run lint
cd backend && npm run format:check
```

### Pre-commit

Staged files are auto-formatted by Prettier (lint-staged). ESLint runs on the full codebase for both packages.

### CI

GitHub Actions runs lint + format:check + tests on every push to main and every PR.

## User Flow

1. **Home**: Enter "I know X" + "Teach me Y" → Generate
2. **Curriculum**: Claude returns 4-6 modules × 3-5 lessons; click any lesson to open
3. **Lesson**:
   - Explanation rendered as markdown
   - View toggle: Side-by-side (X code | Y code) or Sequential
   - Monaco editor pre-loaded with Y-way starter code
   - Run → POST `/api/code` → output displayed
   - "Show solution" button
   - Mark complete → saved to SQLite
4. Navigate between lessons; progress persists across sessions
