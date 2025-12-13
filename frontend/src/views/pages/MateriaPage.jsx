const openExternalSearch = (service, query) => {
  let url = '#';
  switch (service) {
    case 'google':
      url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      break;
    case 'youtube':
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      break;
    case 'chatgpt':
      url = `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`;
      break;
    default:
      url = '#';
  }
  window.open(url, '_blank');
};

const MateriaPage = ({ subject, userRole, exams, onStartExam, onNavigate, onUpdateExamDate }) => {
  if (!subject) {
    return <div className="page active"><p>Selecciona una materia para continuar.</p></div>;
  }
  const subjectExam = exams.find((exam) => exam.subjectId === subject.id);

  return (
    <div className="page active space-y-8">
      <button onClick={() => onNavigate('panel')} className="flex items-center text-sm text-primary hover:underline">
        ← Volver a Mi Panel
      </button>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{subject.title}</h1>
          <p className="text-slate-500 dark:text-slate-400">{subject.professor} | {subject.school}</p>
        </div>
        {userRole === 'estudiante' && (
          <div className="space-y-1">
            <label className="text-sm text-slate-500 dark:text-slate-400">Fecha de examen:</label>
            <input
              type="date"
              className="bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-lg p-2 text-sm"
              value={subject.examDate || ''}
              onChange={(event) => onUpdateExamDate(subject.id, event.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-4">Ruta de Estudio</h2>
            <div className="space-y-4">
              {(subject.temario || []).map((tema) => (
                <div key={tema.title} className="glass-effect-light p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-lg">{tema.title}</p>
                    <div className="flex gap-2">
                      <button onClick={() => openExternalSearch('google', `${tema.title} ${subject.title}`)} className="p-2 rounded-full hover:bg-primary/20" title="Buscar en Google">🔎</button>
                      <button onClick={() => openExternalSearch('youtube', `${tema.title} ${subject.title} tutorial`)} className="p-2 rounded-full hover:bg-primary/20" title="Buscar en YouTube">▶️</button>
                      <button onClick={() => openExternalSearch('chatgpt', `Explica el tema ${tema.title} de ${subject.title} para estudiantes de ingeniería con ejemplos.`)} className="p-2 rounded-full hover:bg-primary/20" title="Consultar IA">🤖</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-500/10 p-4 rounded-xl space-y-3">
              <h3 className="font-semibold">Diagnóstico con IA</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ejercicios personalizados por nivel.</p>
              <div className="flex gap-2">
                {['Básico', 'Intermedio', 'Avanzado'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className="flex-1 text-xs py-2 bg-blue-500/80 text-white rounded-md hover:bg-blue-500"
                    onClick={() => openExternalSearch('chatgpt', `Crea un quiz de nivel ${level.toLowerCase()} sobre ${subject.title}`)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-green-500/10 p-4 rounded-xl space-y-3">
              <h3 className="font-semibold">Simulacro de Examen</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Practica con parciales reales.</p>
              {subjectExam ? (
                <button
                  className="w-full py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-md"
                  onClick={() => onStartExam(subjectExam.id)}
                >
                  Empezar Simulacro
                </button>
              ) : (
                <button className="w-full py-2 bg-green-500/40 text-white rounded-md opacity-60 cursor-not-allowed">
                  Sin simulacro disponible
                </button>
              )}
              <button
                type="button"
                className="w-full py-2 bg-primary/20 text-primary rounded-md"
                onClick={() => onNavigate('simulador', { subjectId: subject.id })}
              >
                Generar simulador
              </button>
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <div className="glass-effect-light p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Tutoría SOS</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">¿Atascado? Resuelve tus dudas con un monitor experto.</p>
            <button className="w-full py-2 bg-red-500/80 hover:bg-red-500 text-white font-semibold rounded-lg" onClick={() => onNavigate('tutorias')}>
              Agendar Asesoría
            </button>
          </div>
          <div className="glass-effect-light p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Tu Progreso</h3>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">Progreso General</span>
              <span className="text-sm font-bold text-primary">{subject.progress || 0}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${subject.progress || 0}%` }} />
            </div>
            <button className="mt-4 text-sm text-primary hover:underline" onClick={() => onNavigate('progreso')}>
              Ver detalles de progreso
            </button>
          </div>
          <div className="glass-effect-light p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Foro de Discusión</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Únete a la conversación con otros estudiantes.</p>
            <button className="w-full py-2 bg-primary/80 hover:bg-primary text-white rounded-md" onClick={() => onNavigate('foro')}>
              Ir al Foro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MateriaPage;
