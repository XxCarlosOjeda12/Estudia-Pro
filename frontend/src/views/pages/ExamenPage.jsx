import { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../lib/api.js';
import { useAppContext } from '../../context/AppContext.jsx';

const ExamenPage = ({ exam, onFinish }) => {
  const { pushToast } = useAppContext();
  const [timeLeft, setTimeLeft] = useState(exam?.duration || 0);
  const [answers, setAnswers] = useState({});
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [paused, setPaused] = useState(false);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    setTimeLeft(exam?.duration || 0);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (paused) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, paused]);

  useEffect(() => () => {
    setShowKeyboard(false);
    setActiveQuestion(null);
  }, []);

  const keyboardKeys = useMemo(() => [
    '∑', '√', 'π', '∞', '±', '≈', '≠', '≤', '≥', '∫', '÷', '×',
    'sin', 'cos', 'tan', 'log', 'ln', '^', '(', ')', '[', ']', '{', '}'
  ], []);

  const renderQuestion = (text) => {
    if (!text) return '';
    return text
      .replace(/\\\\/g, '\\')
      .replace(/\n/g, '<br/>');
  };

  if (!exam) return <div className="page active"><p>No hay examen disponible.</p></div>;

  const handleFinish = async () => {
    try {
      const result = await apiService.submitExam(exam.id, answers);
      pushToast({
        title: 'Resultados',
        message: `Obtuviste ${result.calificacion}% (${result.correctas}/${result.total}).`,
        type: result.calificacion >= 60 ? 'success' : 'alert'
      });
      onFinish?.();
    } catch {
      pushToast({ title: 'Examen', message: 'No se pudo enviar el examen.', type: 'alert' });
    }
  };

  const insertKey = (value, questionId) => {
    if (!questionId) return;
    setAnswers((prev) => {
      const current = prev[questionId] || '';
      return { ...prev, [questionId]: `${current}${value} ` };
    });
  };

  const checkQuestion = (question) => {
    const given = (answers[question.id] || '').replace(/\s+/g, '').toLowerCase();
    const expected = (question.answer || '').replace(/\s+/g, '').toLowerCase();
    const ok = given && expected && given === expected;
    setChecked((prev) => ({ ...prev, [question.id]: ok ? 'correct' : 'wrong' }));
    pushToast({
      title: 'Revisión',
      message: ok ? 'Respuesta correcta.' : 'Respuesta incorrecta, revisa la solución.',
      type: ok ? 'success' : 'alert'
    });
  };

  const openWolfram = (query) => {
    if (!query) return;
    const url = `https://www.wolframalpha.com/input?i=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
  };

  const handleExit = () => {
    if (Object.keys(answers).length) {
      const confirmLeave = window.confirm('¿Quieres pausar el examen y salir?');
      if (confirmLeave) {
        setPaused(true);
        onFinish?.();
      }
      return;
    }
    onFinish?.();
  };

  return (
    <div className="page active space-y-6">
      <div className="flex items-center justify-between">
        <button className="text-primary hover:underline" onClick={handleExit}>
          ← Volver a la materia
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-lg bg-slate-800/60 text-slate-200 border border-white/5"
            onClick={() => setPaused((prev) => !prev)}
          >
            {paused ? 'Reanudar' : 'Pausar'}
          </button>
          <div className="text-2xl font-mono bg-red-500/20 text-red-500 py-2 px-4 rounded-lg">
            {new Date(timeLeft * 1000).toISOString().substring(14, 19)}
          </div>
        </div>
      </div>
      <div>
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <p className="text-slate-500 dark:text-slate-400">Resuelve los ejercicios en el tiempo establecido.</p>
      </div>
      <div className="space-y-4">
        {(exam.questions || []).map((question, index) => (
          <div key={question.id} className="glass-effect-light p-6 rounded-2xl space-y-3">
            <p className="font-semibold flex items-center gap-2">
              Pregunta {index + 1}/{exam.questions.length}
              {checked[question.id] && (
                <span className={`text-xs px-2 py-1 rounded-full ${checked[question.id] === 'correct' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {checked[question.id] === 'correct' ? 'Correcta' : 'Incorrecta'}
                </span>
              )}
            </p>
            <div className="text-lg whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderQuestion(question.text) }} />
            <textarea
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl bg-white/80 dark:bg-slate-900/60 p-3 text-lg"
              placeholder="Escribe tu respuesta aquí..."
              value={answers[question.id] || ''}
              onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))}
            />
            <div className="flex justify-end">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    setActiveQuestion(question.id);
                    setShowKeyboard((prev) => (activeQuestion === question.id ? !prev : true));
                  }}
                >
                  {showKeyboard && activeQuestion === question.id ? 'Ocultar teclado' : 'Mostrar teclado'}
                </button>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-primary"
                  onClick={() => checkQuestion(question)}
                >
                  Revisar
                </button>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-primary"
                  onClick={() => openWolfram(question.wolframQuery)}
                >
                  Ver solución en Wolfram
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center">
        <button className="py-3 px-8 bg-secondary/80 hover:bg-secondary text-white font-bold rounded-lg transition" onClick={handleFinish}>
          Terminar y Calificar Examen
        </button>
      </div>
      {showKeyboard && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 glass-effect-light rounded-2xl p-4 shadow-2xl border border-white/10 w-[90vw] max-w-3xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-200">Teclado matemático</p>
            <button className="text-slate-400 hover:text-slate-100" onClick={() => setShowKeyboard(false)}>✕</button>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {keyboardKeys.map((key) => (
              <button
                key={key}
                type="button"
                className="py-2 px-3 rounded-lg bg-slate-900/60 border border-white/5 text-sm hover:border-primary hover:text-primary"
                onClick={() => insertKey(key, activeQuestion || exam.questions?.[0]?.id)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamenPage;
