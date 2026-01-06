import { useEffect, useMemo, useState, useCallback } from 'react';
import { apiService } from '../../lib/api';
import { useAppContext } from '../../context/AppContext.jsx';
import MathRenderer from '../../components/MathRenderer.jsx';

const DIFFICULTY_CONFIG = {
  FACIL: { label: 'Fácil', color: 'green', bgClass: 'bg-green-500/20', textClass: 'text-green-400' },
  MEDIA: { label: 'Intermedio', color: 'yellow', bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-400' },
  DIFICIL: { label: 'Avanzado', color: 'red', bgClass: 'bg-red-500/20', textClass: 'text-red-400' }
};

const normalizeDifficulty = (value = '') => {
  const normalized = value.toString().trim().toUpperCase();
  const map = {
    INTERMEDIO: 'MEDIA',
    INTERMEDIA: 'MEDIA',
    AVANZADO: 'DIFICIL',
    AVANZADA: 'DIFICIL',
    BÁSICO: 'FACIL',
    BASICO: 'FACIL',
    EASY: 'FACIL',
    MEDIUM: 'MEDIA',
    HARD: 'DIFICIL'
  };
  return map[normalized] || normalized || 'FACIL';
};

const SimuladorPage = ({ subject, exams, onBack }) => {
  const { pushToast } = useAppContext();
  const [selectedDifficulty, setSelectedDifficulty] = useState('FACIL');
  const [templates, setTemplates] = useState([]);
  const [examMode, setExamMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [showExplanation, setShowExplanation] = useState({});
  const [loading, setLoading] = useState(true);

  // Cargar plantillas del backend
  useEffect(() => {
    if (!subject?.id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiService.getExamTemplates(subject.id);
        if (!cancelled) {
          setTemplates(res?.templates || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('No se pudieron cargar plantillas del backend', error);
          setTemplates([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [subject?.id]);

  // Exámenes de esta materia
  const subjectExams = useMemo(() => {
    return exams.filter((exam) => exam.subjectId === subject?.id);
  }, [exams, subject?.id]);

  // Opciones de dificultad disponibles
  const difficultyOptions = useMemo(() => {
    const available = new Set();
    
    // Agregar dificultades de exámenes existentes
    subjectExams.forEach((exam) => {
      const diff = normalizeDifficulty(exam.difficulty || exam.difficultyCode);
      if (diff) available.add(diff);
    });
    
    // Agregar dificultades de plantillas
    templates.forEach((tpl) => {
      const diff = normalizeDifficulty(tpl.difficulty);
      if (diff) available.add(diff);
    });
    
    // Si no hay ninguna, agregar las tres por defecto
    if (available.size === 0) {
      return ['FACIL', 'MEDIA', 'DIFICIL'].map(key => ({
        value: key,
        ...DIFFICULTY_CONFIG[key]
      }));
    }
    
    return Array.from(available).map(key => ({
      value: key,
      ...DIFFICULTY_CONFIG[key]
    }));
  }, [subjectExams, templates]);

  // Examen activo para la dificultad seleccionada
  const activeExam = useMemo(() => {
    const normalized = normalizeDifficulty(selectedDifficulty);
    return subjectExams.find((exam) => 
      normalizeDifficulty(exam.difficulty || exam.difficultyCode) === normalized
    ) || null;
  }, [subjectExams, selectedDifficulty]);

  // Plantilla activa para la dificultad seleccionada
  const activeTemplate = useMemo(() => {
    const normalized = normalizeDifficulty(selectedDifficulty);
    return templates.find((tpl) => normalizeDifficulty(tpl.difficulty) === normalized) || null;
  }, [templates, selectedDifficulty]);

  // Lista de preguntas del examen o plantilla activa (sin duplicados)
  const questionsList = useMemo(() => {
    let questions = [];
    
    if (activeExam?.questions?.length) {
      questions = activeExam.questions;
    } else if (activeTemplate?.questions?.length) {
      questions = activeTemplate.questions;
    }
    
    // Eliminar duplicados basándose en el texto de la pregunta
    const seen = new Set();
    return questions.filter(q => {
      const key = (q.text || q.texto || '').toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeExam, activeTemplate]);

  // Pregunta actual
  const currentQuestion = questionsList[currentQuestionIndex];
  const diffConfig = DIFFICULTY_CONFIG[normalizeDifficulty(selectedDifficulty)] || DIFFICULTY_CONFIG.FACIL;

  // Iniciar examen
  const startExam = useCallback(() => {
    setExamMode(true);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults(null);
    setShowExplanation({});
  }, []);

  // Seleccionar respuesta
  const selectAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  }, []);

  // Verificar una pregunta individual
  const checkAnswer = useCallback((question) => {
    const userAnswer = answers[question.id];
    if (!userAnswer) {
      pushToast({ title: 'Examen', message: 'Selecciona una respuesta primero.', type: 'info' });
      return;
    }
    
    const correct = (question.answer || question.respuesta_correcta || '').toUpperCase();
    const isCorrect = userAnswer.toUpperCase() === correct;
    
    setShowExplanation(prev => ({ ...prev, [question.id]: true }));
    
    pushToast({
      title: 'Revisión',
      message: isCorrect ? '¡Correcto!' : `Incorrecto. La respuesta correcta es: ${correct}`,
      type: isCorrect ? 'success' : 'alert'
    });
  }, [answers, pushToast]);

  // Finalizar examen y calcular resultados
  const finishExam = useCallback(() => {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const details = [];

    questionsList.forEach((q, idx) => {
      const userAnswer = answers[q.id];
      const correctAnswer = (q.answer || q.respuesta_correcta || '').toUpperCase();
      
      if (!userAnswer) {
        unanswered++;
        details.push({ question: idx + 1, status: 'unanswered', correct: correctAnswer });
      } else if (userAnswer.toUpperCase() === correctAnswer) {
        correct++;
        details.push({ question: idx + 1, status: 'correct', correct: correctAnswer });
      } else {
        incorrect++;
        details.push({ question: idx + 1, status: 'incorrect', userAnswer, correct: correctAnswer });
      }
    });

    const total = questionsList.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    
    setResults({ correct, incorrect, unanswered, total, score, details });
    
    pushToast({
      title: 'Examen Completado',
      message: `Obtuviste ${score}% (${correct}/${total} correctas)`,
      type: score >= 60 ? 'success' : 'alert'
    });
  }, [questionsList, answers, pushToast]);

  // Reiniciar examen
  const resetExam = useCallback(() => {
    setExamMode(false);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults(null);
    setShowExplanation({});
  }, []);

  // Vista de resultados
  if (results) {
    return (
      <div className="page active space-y-6">
        <button className="text-primary hover:underline" onClick={resetExam}>
          ← Volver al simulador
        </button>
        <h1 className="text-3xl font-bold">Resultados del Examen</h1>
        
        <div className="glass-effect-light p-6 rounded-2xl space-y-6">
          <div className="text-center">
            <div className={`text-6xl font-bold ${results.score >= 60 ? 'text-green-500' : 'text-red-500'}`}>
              {results.score}%
            </div>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              {results.score >= 60 ? '¡Buen trabajo!' : 'Sigue practicando'}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-500/20 p-4 rounded-xl">
              <div className="text-2xl font-bold text-green-400">{results.correct}</div>
              <div className="text-sm text-slate-400">Correctas</div>
            </div>
            <div className="bg-red-500/20 p-4 rounded-xl">
              <div className="text-2xl font-bold text-red-400">{results.incorrect}</div>
              <div className="text-sm text-slate-400">Incorrectas</div>
            </div>
            <div className="bg-slate-500/20 p-4 rounded-xl">
              <div className="text-2xl font-bold text-slate-400">{results.unanswered}</div>
              <div className="text-sm text-slate-400">Sin responder</div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold">Detalle por pregunta:</h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {results.details.map((d, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg text-center text-sm font-medium ${
                    d.status === 'correct' ? 'bg-green-500/20 text-green-400' :
                    d.status === 'incorrect' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}
                  title={d.status === 'incorrect' ? `Tu respuesta: ${d.userAnswer}, Correcta: ${d.correct}` : ''}
                >
                  {d.question}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              className="px-6 py-3 bg-primary/80 hover:bg-primary text-white rounded-lg font-medium"
              onClick={startExam}
            >
              Reintentar Examen
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-slate-500/50 hover:bg-slate-500/70 text-white rounded-lg font-medium"
              onClick={resetExam}
            >
              Elegir otra dificultad
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista del examen en modo activo
  if (examMode && currentQuestion) {
    const options = currentQuestion.options || [
      currentQuestion.opcion_a,
      currentQuestion.opcion_b,
      currentQuestion.opcion_c,
      currentQuestion.opcion_d
    ].filter(Boolean);
    
    const optionLabels = ['A', 'B', 'C', 'D'];
    const showingExplanation = showExplanation[currentQuestion.id];

    return (
      <div className="page active space-y-6">
        <div className="flex items-center justify-between">
          <button className="text-primary hover:underline" onClick={resetExam}>
            ← Salir del examen
          </button>
          <div className={`px-3 py-1 rounded-full text-sm ${diffConfig.bgClass} ${diffConfig.textClass}`}>
            {diffConfig.label}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Pregunta {currentQuestionIndex + 1} de {questionsList.length}
          </h1>
          <div className="text-sm text-slate-400">
            Respondidas: {Object.keys(answers).length}/{questionsList.length}
          </div>
        </div>
        
        {/* Barra de progreso */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questionsList.length) * 100}%` }}
          />
        </div>

        <div className="glass-effect-light p-6 rounded-2xl space-y-6">
          {/* Texto de la pregunta */}
          <div className="text-lg font-medium">
            <MathRenderer text={currentQuestion.text || currentQuestion.texto_pregunta || ''} />
          </div>
          
          {/* Opciones */}
          <div className="space-y-3">
            {options.map((option, idx) => {
              const label = optionLabels[idx];
              const isSelected = answers[currentQuestion.id] === label;
              const correctAnswer = (currentQuestion.answer || currentQuestion.respuesta_correcta || '').toUpperCase();
              const isCorrectOption = showingExplanation && label === correctAnswer;
              const isWrongSelected = showingExplanation && isSelected && label !== correctAnswer;
              
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => !showingExplanation && selectAnswer(currentQuestion.id, label)}
                  disabled={showingExplanation}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                    isCorrectOption ? 'bg-green-500/30 border-2 border-green-500' :
                    isWrongSelected ? 'bg-red-500/30 border-2 border-red-500' :
                    isSelected ? 'bg-primary/30 border-2 border-primary' :
                    'bg-white/50 dark:bg-slate-800/50 border border-light-border dark:border-dark-border hover:bg-primary/10'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    isCorrectOption ? 'bg-green-500 text-white' :
                    isWrongSelected ? 'bg-red-500 text-white' :
                    isSelected ? 'bg-primary text-white' :
                    'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {label}
                  </span>
                  <span className="flex-1">
                    <MathRenderer text={option} />
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Explicación */}
          {showingExplanation && currentQuestion.explanation && (
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <p className="text-sm font-medium text-blue-400 mb-2">Explicación:</p>
              <MathRenderer text={currentQuestion.explanation || currentQuestion.explicacion || ''} />
            </div>
          )}
          
          {/* Botones de acción */}
          <div className="flex gap-3 justify-between">
            <button
              type="button"
              className="px-4 py-2 bg-slate-500/50 text-white rounded-lg disabled:opacity-50"
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
            >
              ← Anterior
            </button>
            
            <div className="flex gap-3">
              {!showingExplanation && (
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg"
                  onClick={() => checkAnswer(currentQuestion)}
                >
                  Verificar
                </button>
              )}
              
              {currentQuestionIndex < questionsList.length - 1 ? (
                <button
                  type="button"
                  className="px-4 py-2 bg-primary/80 hover:bg-primary text-white rounded-lg"
                  onClick={() => {
                    setCurrentQuestionIndex(prev => prev + 1);
                    setShowExplanation(prev => ({ ...prev, [currentQuestion.id]: false }));
                  }}
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-lg font-medium"
                  onClick={finishExam}
                >
                  Finalizar Examen
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Navegación rápida */}
        <div className="glass-effect-light p-4 rounded-xl">
          <p className="text-sm text-slate-400 mb-3">Navegación rápida:</p>
          <div className="flex flex-wrap gap-2">
            {questionsList.map((q, idx) => (
              <button
                key={q.id || idx}
                type="button"
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${
                  idx === currentQuestionIndex ? 'bg-primary text-white' :
                  answers[q.id] ? 'bg-green-500/30 text-green-400' :
                  'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vista de selección de dificultad
  return (
    <div className="page active space-y-6">
      <button className="text-primary hover:underline" onClick={onBack}>
        ← Volver a {subject?.title || 'la materia'}
      </button>
      <h1 className="text-3xl font-bold">Simulador de Exámenes</h1>
      <p className="text-slate-500 dark:text-slate-400">
        Materia: <span className="font-semibold text-slate-700 dark:text-slate-200">{subject?.title}</span>
      </p>
      
      {loading ? (
        <div className="glass-effect-light p-8 rounded-2xl text-center">
          <p className="text-slate-400">Cargando exámenes...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {difficultyOptions.map((opt) => {
            const config = DIFFICULTY_CONFIG[opt.value] || DIFFICULTY_CONFIG.FACIL;
            const examForDiff = subjectExams.find(e => 
              normalizeDifficulty(e.difficulty || e.difficultyCode) === opt.value
            );
            const templateForDiff = templates.find(t => 
              normalizeDifficulty(t.difficulty) === opt.value
            );
            const questionsCount = examForDiff?.questions?.length || templateForDiff?.questions?.length || 0;
            const hasQuestions = questionsCount > 0;
            const isSelected = selectedDifficulty === opt.value;
            
            return (
              <div
                key={opt.value}
                className={`glass-effect-light p-6 rounded-2xl space-y-4 cursor-pointer transition-all border-2 ${
                  isSelected ? `border-${config.color}-500 ${config.bgClass}` : 'border-transparent hover:border-slate-400/50'
                }`}
                onClick={() => setSelectedDifficulty(opt.value)}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-bold ${config.textClass}`}>{config.label}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
                    {questionsCount} preguntas
                  </span>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {opt.value === 'FACIL' && 'Conceptos básicos y ejercicios introductorios.'}
                  {opt.value === 'MEDIA' && 'Aplicación de conceptos y problemas de nivel medio.'}
                  {opt.value === 'DIFICIL' && 'Problemas complejos y casos avanzados.'}
                </p>
                
                {hasQuestions ? (
                  <button
                    type="button"
                    className={`w-full py-3 rounded-lg font-medium text-white ${
                      opt.value === 'FACIL' ? 'bg-green-500/80 hover:bg-green-500' :
                      opt.value === 'MEDIA' ? 'bg-yellow-500/80 hover:bg-yellow-500' :
                      'bg-red-500/80 hover:bg-red-500'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDifficulty(opt.value);
                      setTimeout(startExam, 100);
                    }}
                  >
                    Iniciar Examen {config.label}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full py-3 rounded-lg font-medium bg-slate-500/30 text-slate-400 cursor-not-allowed"
                    disabled
                  >
                    No disponible
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {/* Preview de preguntas */}
      {questionsList.length > 0 && (
        <div className="glass-effect-light p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Vista previa - {diffConfig.label}
            </h3>
            <span className="text-sm text-slate-400">
              {questionsList.length} preguntas
            </span>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {questionsList.map((q, idx) => (
              <div key={q.id || idx} className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm font-medium text-slate-500 mr-2">{idx + 1}.</span>
                <span className="text-sm">
                  <MathRenderer text={(q.text || q.texto_pregunta || '').substring(0, 100) + '...'} />
                </span>
              </div>
            ))}
          </div>
          
          <button
            type="button"
            className="w-full py-3 bg-primary/80 hover:bg-primary text-white rounded-lg font-medium"
            onClick={startExam}
          >
            Comenzar Examen ({diffConfig.label})
          </button>
        </div>
      )}
    </div>
  );
};

export default SimuladorPage;
