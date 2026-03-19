export interface LessonMeta {
  id: string
  title: string
}

export interface Module {
  id: string
  title: string
  lessons: LessonMeta[]
}

export interface Curriculum {
  id: string
  knownTech: string
  targetTech: string
  description: string
  modules: Module[]
}

export interface Lesson {
  id: string
  title: string
  explanation: string
  knownWayCode: string
  targetWayCode: string
  exercise: string
  starterCode: string
  solutionCode: string
  language: 'typescript' | 'javascript' | 'python'
}

export interface ExecuteResult {
  stdout: string
  stderr: string
  exitCode: number
}

export interface ProgressEntry {
  lesson_id: string
  completed: number
}

export interface CourseIndexEntry {
  id: string
  knownTech: string
  targetTech: string
  totalLessons: number
  completedLessons: number
  firstIncompleteLessonId: string | null
}
