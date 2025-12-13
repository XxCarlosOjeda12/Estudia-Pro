const ProgresoPage = ({ subjects }) => {
  const bestSubjects = [...subjects].sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 3);
  const totalProgress = subjects.reduce((sum, subj) => sum + (subj.progress || 0), 0);
  const average = subjects.length ? Math.round(totalProgress / subjects.length) : 0;
  const simulacros = [
    { label: 'Simulacro 1', score: 72 },
    { label: 'Simulacro 2', score: 80 },
    { label: 'Simulacro 3', score: 65 },
    { label: 'Simulacro 4', score: 88 }
  ];

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mi Progreso General</h1>
        <p className="text-slate-500 dark:text-slate-400">Analiza tu evolución y áreas de mejora.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-effect-light p-6 rounded-2xl">
          <h3 className="font-bold mb-4">Materias con Mejor Progreso</h3>
          <ul className="space-y-3">
            {bestSubjects.map((subject) => (
              <li key={subject.id} className="flex items-center justify-between">
                <span>{subject.title}</span>
                <span className="font-bold text-primary">{subject.progress || 0}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-effect-light p-6 rounded-2xl">
          <h3 className="font-bold mb-4">Recomendaciones</h3>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300 text-sm">
            <li>Practica más ejercicios de derivadas.</li>
            <li>Revisa los conceptos de espacios vectoriales.</li>
            <li>Intenta resolver exámenes pasados.</li>
          </ul>
        </div>
      </div>
      <div className="glass-effect-light p-6 rounded-2xl">
        <h3 className="font-bold mb-4">Evolución de simulacros</h3>
        <div className="flex items-end gap-3 h-40">
          {simulacros.map((item) => (
            <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-slate-800 rounded-full h-28 overflow-hidden flex items-end">
                <div
                  className="w-full bg-gradient-to-t from-primary to-secondary rounded-full transition-all"
                  style={{ height: `${item.score}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{item.label}</p>
              <p className="text-sm font-semibold text-primary">{item.score}%</p>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-effect-light p-6 rounded-2xl space-y-4">
        <h3 className="font-bold">Estadísticas de Estudio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{subjects.length}</div>
            <p className="text-sm text-slate-500">Materias</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{bestSubjects[0]?.progress ?? 0}%</div>
            <p className="text-sm text-slate-500">Mejor materia</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{average}%</div>
            <p className="text-sm text-slate-500">Promedio</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{Math.max(average - 10, 0)}%</div>
            <p className="text-sm text-slate-500">Objetivo</p>
          </div>
        </div>
        <div className="space-y-3">
          {(subjects || []).map((subject) => (
            <div key={subject.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">{subject.title}</span>
                <span className="font-semibold text-primary">{subject.progress || 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                  style={{ width: `${subject.progress || 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgresoPage;
