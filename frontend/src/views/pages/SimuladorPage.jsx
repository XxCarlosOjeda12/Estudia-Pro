import { useMemo, useState } from 'react';

const SimuladorPage = ({ subject, exams, onStartExam, onBack }) => {
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('all');

  const questionsPool = useMemo(() => {
    const pool = exams.filter((exam) => (subject ? exam.subjectId === subject.id : true)).flatMap((exam) =>
      exam.questions.map((question, index) => ({
        ...question,
        origin: exam.title,
        difficulty: question.difficulty || ['Fácil', 'Intermedio', 'Avanzado'][index % 3]
      }))
    );
    return difficulty === 'all' ? pool : pool.filter((q) => q.difficulty === difficulty);
  }, [exams, subject, difficulty]);

  const selection = questionsPool.slice(0, count);

  return (
    <div className="page active space-y-6">
      <button className="text-primary hover:underline" onClick={onBack}>
        ← Volver a {subject?.title || 'la materia'}
      </button>
      <h1 className="text-3xl font-bold">Simulador de Exámenes</h1>
      <div className="glass-effect-light p-6 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Número de preguntas</label>
            <input
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Dificultad</label>
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
            >
              <option value="all">Todas</option>
              <option value="Fácil">Fácil</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
          </div>
        </div>
        <div className="glass-effect-light p-4 rounded-xl bg-white/70 dark:bg-slate-900/30 space-y-3">
          <p className="font-semibold mb-2">Tu simulacro está listo</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 dark:text-slate-300">
            {selection.map((item) => (
              <li key={item.id}>
                {item.text} <span className="text-xs text-slate-400">({item.difficulty} • {item.origin})</span>
              </li>
            ))}
          </ol>
          {selection.length > 0 && (
            <button
              type="button"
              className="w-full py-2 bg-primary/80 hover:bg-primary text-white rounded-md"
              onClick={() => {
                const examMatch = exams.find((exam) => exam.subjectId === subject?.id);
                if (examMatch) onStartExam({ examId: examMatch.id });
              }}
            >
              Abrir examen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimuladorPage;
