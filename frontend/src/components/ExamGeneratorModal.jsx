import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiService } from '../lib/api';

const buildDefaultQuestions = (count, difficulty) =>
  Array.from({ length: count }).map((_, index) => ({
    id: `q-${index + 1}`,
    text: '',
    options: ['', '', '', ''],
    answer: 'A',
    difficulty,
    explanation: ''
  }));

const difficultyOptions = [
  { value: 'FACIL', label: 'Fácil' },
  { value: 'MEDIA', label: 'Intermedio' },
  { value: 'DIFICIL', label: 'Avanzado' }
];

const normalizeText = (value) => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const ExamGeneratorModal = ({ open, subjects = [], onClose, onGenerate, loading }) => {
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('Simulador Parcial');
  const [duration, setDuration] = useState(30);
  const [passingScore, setPassingScore] = useState(70);
  const [difficulty, setDifficulty] = useState('FACIL');
  const [questions, setQuestions] = useState(buildDefaultQuestions(5, 'FACIL'));
  const [questionsCount, setQuestionsCount] = useState(5);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState('');

  const courseOptions = useMemo(() => {
    const filtered = subjects.filter((s) => normalizeText(s.title || s.nombre || '').includes('calculo'));
    return filtered.length ? filtered : subjects;
  }, [subjects]);

  useEffect(() => {
    if (!open || !courseOptions.length) return;
    const currentExists = courseOptions.some((s) => s.id === courseId);
    if (!courseId || !currentExists) {
      setCourseId(courseOptions[0].id);
    }
  }, [open, courseOptions, courseId]);

  useEffect(() => {
    if (!open || !courseId) return;
    let cancelled = false;
    const loadTemplates = async () => {
      setTemplatesLoading(true);
      setTemplatesError('');
      setTemplates([]);
      setActiveTemplate(null);
      try {
        const res = await apiService.getExamTemplates(courseId);
        if (!cancelled) {
          setTemplates(res?.templates || []);
        }
      } catch (error) {
        if (!cancelled) {
          setTemplates([]);
          setTemplatesError(error?.message || 'No se pudieron cargar plantillas.');
        }
      } finally {
        if (!cancelled) setTemplatesLoading(false);
      }
    };
    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [open, courseId]);

  const templateOptions = useMemo(() => {
    const map = new Map();
    templates.forEach((tpl) => map.set((tpl.difficulty || '').toUpperCase(), tpl));
    return difficultyOptions.map((opt) => ({
      ...opt,
      template: map.get(opt.value) || null
    }));
  }, [templates]);

  const applyTemplate = useCallback((templateDifficulty) => {
    const targetDifficulty = templateDifficulty || difficulty || 'FACIL';
    const tpl = templateOptions.find((opt) => opt.value === targetDifficulty)?.template;
    setDifficulty(targetDifficulty);
    if (tpl && tpl.questions?.length) {
      setQuestionsCount(tpl.questions.length);
      setQuestions(
        tpl.questions.map((q, idx) => ({
          id: q.id || `${targetDifficulty.toLowerCase()}-${idx + 1}`,
          text: q.text || '',
          options: Array.isArray(q.options) && q.options.length ? q.options : ['', '', '', ''],
          answer: (q.answer || 'A').toString().toUpperCase(),
          difficulty: targetDifficulty,
          explanation: q.explanation || ''
        }))
      );
      setActiveTemplate({ difficulty: targetDifficulty });
    } else {
      setQuestions(buildDefaultQuestions(questionsCount, targetDifficulty));
      setActiveTemplate(null);
    }
  }, [difficulty, questionsCount, templateOptions]);

  useEffect(() => {
    if (!open) return;
    if (!templates.length) return;
    const first = templates[0]?.difficulty || 'FACIL';
    applyTemplate(first);
  }, [templates, open, applyTemplate]);

  const syncQuestionsToCount = (nextCount) => {
    setQuestionsCount(nextCount);
    setQuestions((prev) => {
      const base = prev.length ? prev : buildDefaultQuestions(questionsCount, difficulty);
      const resized = [...base];
      if (nextCount > base.length) {
        resized.push(...buildDefaultQuestions(nextCount - base.length, difficulty));
      } else {
        resized.length = nextCount;
      }
      return resized.map((q) => ({ ...q, difficulty }));
    });
  };

  const handleDifficultyChange = (value) => {
    setDifficulty(value);
    setQuestions((prev) => prev.map((q) => ({ ...q, difficulty: value })));
    setActiveTemplate((prev) => (prev ? { ...prev, difficulty: value } : prev));
  };

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, [field]: value } : q)));
  };

  const updateOption = (index, optIndex, value) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === index ? { ...q, options: q.options.map((opt, j) => (j === optIndex ? value : opt)) } : q
      )
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId) return;
    const payload = {
      courseId,
      title,
      duration,
      passingScore,
      difficulty,
      templateDifficulty: activeTemplate?.difficulty,
      questionsCount,
      questions: questions.map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        text: q.text,
        options: q.options,
        answer: q.answer,
        difficulty,
        explanation: q.explanation
      }))
    };
    await onGenerate(payload);
  };

  if (!open) return null;

  const activeTemplateLabel = activeTemplate
    ? difficultyOptions.find((d) => d.value === activeTemplate.difficulty)?.label || activeTemplate.difficulty
    : templatesLoading
      ? 'Cargando plantillas...'
      : 'Sin plantilla aplicada';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <div>
            <h3 className="text-xl font-bold">Generar simulador de examen</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              5 preguntas, 3 niveles y soporte LaTeX / Wolfram en el banco de preguntas.
            </p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xl leading-none" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Curso</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                disabled={!courseOptions.length}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 disabled:opacity-60"
              >
                <option value="" disabled>
                  {courseOptions.length ? 'Selecciona un curso' : 'Sin cursos disponibles'}
                </option>
                {courseOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title || s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Duración (minutos)</label>
              <input
                type="number"
                min="5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Puntaje mínimo (aprobación %)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Cantidad de preguntas</label>
              <input
                type="number"
                min="1"
                max="20"
                value={questionsCount}
                onChange={(e) => syncQuestionsToCount(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Dificultad (aplica a todas)</label>
              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10"
              >
                {difficultyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {templateOptions.map((opt) => {
              const isActive = activeTemplate?.difficulty === opt.value;
              const hasTemplate = Boolean(opt.template);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-primary text-white border-primary'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-white/10'
                  } ${hasTemplate ? '' : 'border-dashed'}`}
                  disabled={templatesLoading}
                  onClick={() => applyTemplate(opt.value)}
                >
                  {opt.label} {hasTemplate ? '' : '(vacía)'}
                </button>
              );
            })}
            <button
              type="button"
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-white/20"
              onClick={() => {
                setQuestions(buildDefaultQuestions(questionsCount, difficulty));
                setActiveTemplate(null);
              }}
            >
              Limpiar banco
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
              Plantilla seleccionada: {activeTemplateLabel}
            </span>
            {templatesError && <span className="text-xs text-red-400">{templatesError}</span>}
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-4 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Pregunta {idx + 1}</p>
                  <span className="text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {difficultyOptions.find((d) => d.value === difficulty)?.label || 'Fácil'}
                  </span>
                </div>
                <textarea
                  value={q.text}
                  onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                  placeholder="Enuncia la pregunta (soporta LaTeX)"
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                  rows={2}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['A', 'B', 'C', 'D'].map((label, optIdx) => (
                    <div key={label} className="flex items-center gap-2">
                      <input
                        value={q.options[optIdx] || ''}
                        onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                        placeholder={`Opción ${label}`}
                        className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="radio"
                          name={`answer-${idx}`}
                          checked={q.answer === label}
                          onChange={() => updateQuestion(idx, 'answer', label)}
                        />
                        Correcta
                      </label>
                    </div>
                  ))}
                </div>
                <textarea
                  value={q.explanation}
                  onChange={(e) => updateQuestion(idx, 'explanation', e.target.value)}
                  placeholder="Explicación / pista (opcional)"
                  className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs"
                  rows={2}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/20" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-primary text-white font-semibold disabled:opacity-60"
            >
              {loading ? 'Generando...' : 'Generar simulador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamGeneratorModal;
