import { useEffect, useState, useRef } from 'react';
import { apiService } from '../../lib/api.js';
import { useAppContext } from '../../context/AppContext.jsx';
import 'mathlive';

import MathRenderer from '../../components/MathRenderer.jsx';

// Wrapper for the MathLive web component (for open-ended questions)
const MathInput = ({ value, onChange }) => {
  const mfRef = useRef(null);

  useEffect(() => {
    if (mfRef.current && mfRef.current.value !== value) {
      mfRef.current.setValue(value);
    }
  }, [value]);

  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const mf = mfRef.current;
    if (!mf) return;

    const handleInput = (evt) => {
      if (onChangeRef.current) {
        onChangeRef.current(evt.target.value);
      }
    };

    mf.addEventListener('input', handleInput);
    return () => {
      mf.removeEventListener('input', handleInput);
      if (window.mathVirtualKeyboard) {
        window.mathVirtualKeyboard.hide();
      }
    };
  }, []);

  return (
    <math-field
      ref={mfRef}
      style={{
        display: 'block',
        width: '100%',
        padding: '8px',
        fontSize: '1.2rem',
        borderRadius: '0.75rem',
        border: '1px solid #cbd5e1',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: '#1e293b'
      }}
    >
      {value}
    </math-field>
  );
};

const ExamenPage = ({ exam, onFinish }) => {
  const { pushToast } = useAppContext();
  const [timeLeft, setTimeLeft] = useState(() => exam?.duration || 0);
  const [answers, setAnswers] = useState({});
  const [paused, setPaused] = useState(false);
  const [checked, setChecked] = useState({});
  const [showExplanation, setShowExplanation] = useState({});
  const examDurationRef = useRef(exam?.duration);

  // Reiniciar tiempo si cambia el examen
  if (exam?.duration !== examDurationRef.current) {
    examDurationRef.current = exam?.duration;
    setTimeLeft(exam?.duration || 0);
  }

  // Timer del examen
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (paused) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paused]);

  // Detectar si la pregunta es de opción múltiple
  const isMultipleChoice = (question) => {
    return question.options && Array.isArray(question.options) && question.options.length > 0;
  };

  // Construir query para Wolfram Alpha
  const buildWolframQuery = (question) => {
    // Usar wolframQuery si existe, sino usar el texto de la pregunta
    let query = question.wolframQuery || question.text || '';
    
    // Limpiar LaTeX para Wolfram
    query = query
      .replace(/\$\$/g, '')
      .replace(/\$/g, '')
      .replace(/\\,/g, ' ')
      .replace(/\\to/gi, '->')
      .replace(/\\rightarrow/gi, '->')
      .replace(/\\pi/gi, 'pi')
      .replace(/\\infty/gi, 'infinity')
      .replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/gi, '($1)/($2)')
      .replace(/\\sqrt\s*\{([^}]*)\}/gi, 'sqrt($1)')
      .replace(/\\sin/gi, 'sin')
      .replace(/\\cos/gi, 'cos')
      .replace(/\\tan/gi, 'tan')
      .replace(/\\ln/gi, 'ln')
      .replace(/\\log/gi, 'log')
      .replace(/\\lim_\{([^}]*)\}/gi, 'limit as $1 of')
      .replace(/\\int/gi, 'integral of')
      .replace(/\\sum/gi, 'sum of')
      .replace(/\\cdot/gi, '*')
      .replace(/\\times/gi, '*')
      .replace(/\\div/gi, '/')
      .replace(/\\pm/gi, '+-')
      .replace(/\\leq/gi, '<=')
      .replace(/\\geq/gi, '>=')
      .replace(/\\neq/gi, '!=')
      .replace(/\\left/gi, '')
      .replace(/\\right/gi, '')
      .replace(/[{}]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Añadir contexto según el tipo de problema
    const lowerText = (question.text || '').toLowerCase();
    if (lowerText.includes('derivada') || lowerText.includes('derivative')) {
      if (!query.toLowerCase().includes('derivative')) {
        query = `derivative of ${query}`;
      }
    } else if (lowerText.includes('integral')) {
      if (!query.toLowerCase().includes('integral')) {
        query = `integrate ${query}`;
      }
    } else if (lowerText.includes('límite') || lowerText.includes('limit')) {
      if (!query.toLowerCase().includes('limit')) {
        query = `limit ${query}`;
      }
    }

    return query;
  };

  const openWolfram = (question) => {
    const query = buildWolframQuery(question);
    if (!query) {
      pushToast({ title: 'Wolfram', message: 'No hay información para buscar.', type: 'info' });
      return;
    }
    const url = `https://www.wolframalpha.com/input?i=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
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

  const checkQuestion = (question) => {
    const userAnswer = answers[question.id];
    
    if (!userAnswer) {
      pushToast({ title: 'Revisión', message: 'Selecciona o escribe una respuesta primero.', type: 'info' });
      return;
    }

    let isCorrect = false;
    const correctAnswer = (question.answer || question.respuesta_correcta || '').toUpperCase().trim();

    if (isMultipleChoice(question)) {
      // Para opción múltiple, comparar letra seleccionada
      isCorrect = userAnswer.toUpperCase() === correctAnswer;
    } else {
      // Para respuesta abierta, comparar texto (normalizado)
      const normalizedUser = userAnswer.replace(/\s+/g, '').toLowerCase();
      const normalizedCorrect = correctAnswer.replace(/\s+/g, '').toLowerCase();
      isCorrect = normalizedUser === normalizedCorrect;
    }

    setChecked((prev) => ({ ...prev, [question.id]: isCorrect ? 'correct' : 'wrong' }));
    setShowExplanation((prev) => ({ ...prev, [question.id]: true }));
    
    pushToast({
      title: 'Revisión',
      message: isCorrect 
        ? '¡Respuesta correcta!' 
        : `Incorrecto. La respuesta correcta es: ${correctAnswer}`,
      type: isCorrect ? 'success' : 'alert'
    });
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

  const optionLabels = ['A', 'B', 'C', 'D'];

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
        <h1 className="text-3xl font-bold">{exam.title || 'Simulador'}</h1>
        <p className="text-slate-500 dark:text-slate-400">Resuelve los ejercicios en el tiempo establecido.</p>
      </div>

      <div className="space-y-4">
        {(exam.questions || []).map((question, index) => {
          const hasOptions = isMultipleChoice(question);
          const isChecked = checked[question.id];
          const correctAnswer = (question.answer || '').toUpperCase();
          
          return (
            <div key={question.id} className="glass-effect-light p-6 rounded-2xl space-y-4">
              <p className="font-semibold flex items-center gap-2">
                Pregunta {index + 1}/{exam.questions.length}
                {isChecked && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isChecked === 'correct' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {isChecked === 'correct' ? 'Correcta' : 'Incorrecta'}
                  </span>
                )}
              </p>

              {/* Texto de la pregunta */}
              <div className="text-lg">
                <MathRenderer text={question.text || question.texto_pregunta || ''} />
              </div>

              {/* Opciones múltiples o Input libre */}
              {hasOptions ? (
                <div className="space-y-2">
                  {question.options.map((option, optIdx) => {
                    const label = optionLabels[optIdx];
                    const isSelected = answers[question.id] === label;
                    const isCorrectOption = showExplanation[question.id] && label === correctAnswer;
                    const isWrongSelected = showExplanation[question.id] && isSelected && label !== correctAnswer;
                    
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => !showExplanation[question.id] && setAnswers(prev => ({ ...prev, [question.id]: label }))}
                        disabled={showExplanation[question.id]}
                        className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                          isCorrectOption ? 'bg-green-500/30 border-2 border-green-500' :
                          isWrongSelected ? 'bg-red-500/30 border-2 border-red-500' :
                          isSelected ? 'bg-primary/30 border-2 border-primary' :
                          'bg-white/50 dark:bg-slate-800/50 border border-light-border dark:border-dark-border hover:bg-primary/10'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
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
              ) : (
                <div className="my-4">
                  <MathInput
                    value={answers[question.id] || ''}
                    onChange={(val) => setAnswers((prev) => ({ ...prev, [question.id]: val }))}
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Usa el teclado virtual para escribir fórmulas matemáticas (integrales, raíces, fracciones).
                  </p>
                </div>
              )}

              {/* Explicación */}
              {showExplanation[question.id] && question.explanation && (
                <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <p className="text-sm font-medium text-blue-400 mb-2">Explicación:</p>
                  <MathRenderer text={question.explanation || question.explicacion || ''} />
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="text-sm text-slate-400 hover:text-primary transition-colors"
                    onClick={() => checkQuestion(question)}
                  >
                    Revisar
                  </button>
                  <button
                    type="button"
                    className="text-sm text-slate-400 hover:text-primary transition-colors"
                    onClick={() => openWolfram(question)}
                  >
                    Ver solución en Wolfram
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button 
          className="py-3 px-8 bg-secondary/80 hover:bg-secondary text-white font-bold rounded-lg transition" 
          onClick={handleFinish}
        >
          Terminar y Calificar Examen
        </button>
      </div>
    </div>
  );
};

export default ExamenPage;
