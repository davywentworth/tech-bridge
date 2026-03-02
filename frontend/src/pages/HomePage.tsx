import { useNavigate } from 'react-router-dom';
import { CourseSetup } from '../components/CourseSetup';
import { useCourse } from '../hooks/useCourse';

export function HomePage() {
  const navigate = useNavigate();
  const { loading, error, generate } = useCourse();

  async function handleGenerate(knownTech: string, targetTech: string) {
    const curriculum = await generate(knownTech, targetTech);
    if (curriculum) {
      navigate(`/curriculum/${curriculum.id}`, { state: { curriculum } });
    }
  }

  return <CourseSetup onGenerate={handleGenerate} loading={loading} error={error} />;
}
