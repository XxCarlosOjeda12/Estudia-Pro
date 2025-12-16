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

const MateriaPage = ({ subject, userRole, exams, onStartExam, onNavigate, onUpdateExamDate, onDropSubject }) => {
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
          <div className="flex flex-col gap-2 items-start md:items-end">
            <div className="space-y-1">
              <label className="text-sm text-slate-500 dark:text-slate-400">Fecha y hora de examen (hora opcional):</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-lg p-2 text-sm"
                  value={subject.examDate || ''}
                  onChange={(event) => onUpdateExamDate(subject.id, event.target.value, subject.examTime || null)}
                />
                <input
                  type="time"
                  disabled={!subject.examDate}
                  className="bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-lg p-2 text-sm disabled:opacity-50"
                  value={subject.examTime || ''}
                  onChange={(event) => onUpdateExamDate(subject.id, subject.examDate || '', event.target.value || null)}
                />
              </div>
            </div>
            {typeof onDropSubject === 'function' ? (
              <button
                type="button"
                className="text-sm text-red-500 hover:underline"
                onClick={() => {
                  if (confirm('¿Dar de baja esta materia? Se quitará de tu panel.')) {
                    onDropSubject(subject.id);
                  }
                }}
              >
                Dar de baja esta materia
              </button>
            ) : null}
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
                      <button onClick={() => openExternalSearch('google', `${tema.title} ${subject.title}`)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-[#4285F4] transition-colors" title="Buscar en Google">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" /></svg>
                      </button>
                      <button onClick={() => openExternalSearch('youtube', `${tema.title} ${subject.title} tutorial`)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-[#FF0000] transition-colors" title="Ver en YouTube">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                      </button>
                      <button onClick={() => openExternalSearch('chatgpt', `Explica el tema ${tema.title} de ${subject.title} para estudiantes de ingeniería con ejemplos.`)} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-[#00A67E] transition-colors" title="Consultar AI (Perplexity)">
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
                      </button>
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
