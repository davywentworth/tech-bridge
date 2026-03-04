# Tech Bridge

**"I Know X, Teach Me Y"** — An AI-powered learning app that generates structured curricula for developers transitioning between technologies.

Enter two technologies (e.g. Redux → Redux Toolkit, React → Vue, REST → GraphQL) and get a Claude-generated course with interactive lessons, side-by-side code comparisons, and an in-browser code editor.

## Features

- **AI-generated curriculum** — 4–6 modules, each with 3–5 lessons tailored to your background
- **Side-by-side code comparisons** — See the old way vs. the new way
- **In-browser code editor** — Monaco editor with live execution (JS/TS/Python)
- **Progress tracking** — Lesson completion saved locally via SQLite
- **Streaming responses** — Claude streams lesson content as it's generated

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite, TypeScript, Monaco Editor |
| Backend | Express, TypeScript, Node 21 |
| AI | Claude (`claude-opus-4-6`) via `@anthropic-ai/sdk` with adaptive thinking |
| Database | SQLite via `node-sqlite3-wasm` (pure WASM, no native build) |

## Getting Started

### Prerequisites

- Node.js v21+
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# Clone the repo
git clone https://github.com/davywentworth/tech-bridge.git
cd tech-bridge

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

Create a `.env` file in the project root:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

### Running Locally

Open two terminals:

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Usage

1. **Home** — Enter the technology you know and the one you want to learn
2. **Curriculum** — Browse the generated modules and lessons
3. **Lesson** — Read the explanation, compare code examples, write and run code in the editor
4. Mark lessons complete as you go — progress persists across sessions

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/course/generate` | Generate a new curriculum |
| GET | `/api/course/:id` | Fetch a saved curriculum |
| POST | `/api/lesson/generate` | Generate lesson content |
| POST | `/api/code` | Execute code (JS/TS/Python) |
| GET/PUT | `/api/progress/:courseId` | Read/write lesson progress |

## Project Structure

```
tech-bridge/
├── backend/
│   └── src/
│       ├── index.ts
│       ├── types.ts
│       ├── services/       # db, anthropic, executor
│       └── routes/         # course, lesson, execute, progress
└── frontend/
    └── src/
        ├── api/            # API client functions
        ├── components/     # UI components
        ├── hooks/          # useCourse, useProgress
        └── pages/          # HomePage, CurriculumPage, LessonPage
```
