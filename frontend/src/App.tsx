import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { CurriculumPage } from './pages/CurriculumPage'
import { LessonPage } from './pages/LessonPage'
import { Header } from './components/Header'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/curriculum/:courseId" element={<CurriculumPage />} />
        <Route path="/curriculum/:courseId/lesson/:lessonId" element={<LessonPage />} />
      </Routes>
    </BrowserRouter>
  )
}
