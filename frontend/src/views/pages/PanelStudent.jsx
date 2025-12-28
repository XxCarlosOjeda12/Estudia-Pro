import { useMemo, useState } from 'react';

const typeLabel = (type) => {
  const map = {
    EXAMEN: 'Examen',
    QUIZ: 'Quiz',
    TAREA: 'Tarea',
    ESTUDIO: 'Estudio',
    TUTORIA: 'Tutoría',
    OTRO: 'Otro'
  };
  return map[type] || type || 'Otro';
};

const formatUpcomingDate = (isoDate) => {
  if (!isoDate) return '';
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

const PanelStudent = ({ user, subjects, upcomingActivities, onCreateUpcomingActivity, onDeleteUpcomingActivity, navigateTo }) => {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('ESTUDIO');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const sortedActivities = useMemo(() => {
    const list = Array.isArray(upcomingActivities) ? upcomingActivities : [];
    return [...list].sort((a, b) => {
      const aKey = `${a.date || ''}T${a.time || '99:99'}`;
      const bKey = `${b.date || ''}T${b.time || '99:99'}`;
      return aKey.localeCompare(bKey);
    });
  }, [upcomingActivities]);

  const submitNewActivity = async (event) => {
    event.preventDefault();
    if (!newDate) return;
    await onCreateUpcomingActivity({
      title: newTitle.trim() || 'Actividad',
      type: newType,
      date: newDate,
      time: newTime || null
    });
    setNewTitle('');
    setNewType('ESTUDIO');
    setNewDate('');
    setNewTime('');
    setShowAddActivity(false);
  };

  return (
    <div className="page active space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bienvenido, {user?.name}</h1>
        <p className="text-slate-600 dark:text-slate-400">Aquí tienes un resumen de tu actividad.</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Mis Materias</h2>
          <button className="text-sm text-primary hover:underline" onClick={() => navigateTo('explorar')}>
            Explorar materias
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.length > 0 ? (
            subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => navigateTo('materia', { subjectId: subject.id })}
                className="glass-effect-light p-6 rounded-2xl text-left hover:-translate-y-1 hover:shadow-xl transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full">{subject.school || 'ESCOM'}</span>
                  <span className="text-xs text-slate-500">
                    {subject.examDate
                      ? `Examen: ${new Date(subject.examDate).toLocaleDateString('es-MX')}${subject.examTime ? ` ${subject.examTime}` : ''}`
                      : ''}
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-3">{subject.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{subject.professor}</p>
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progreso</span>
                    <span className="font-bold text-primary">{subject.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${subject.progress || 0}%` }} />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="col-span-3 text-center text-slate-500">Aún no tienes materias cargadas.</p>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect-light p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Próximas Actividades</h3>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => setShowAddActivity((prev) => !prev)}
            >
              {showAddActivity ? 'Cancelar' : 'Añadir'}
            </button>
          </div>

          {showAddActivity && (
            <form onSubmit={submitNewActivity} className="mb-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Título</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ej. Repasar derivadas"
                    className="w-full bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Tipo</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-sm"
                  >
                    {['EXAMEN', 'QUIZ', 'TAREA', 'ESTUDIO', 'TUTORIA', 'OTRO'].map((type) => (
                      <option key={type} value={type}>
                        {typeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Día</label>
                  <input
                    required
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Horario (opcional)</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm">
                  Guardar
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {sortedActivities.filter(a => a.type !== 'TUTORIA').length ? (
              sortedActivities.filter(a => a.type !== 'TUTORIA').map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{activity.title}</p>
                    <p className="text-xs text-slate-500">
                      {typeLabel(activity.type)}
                      {activity.origin === 'FECHA_EXAMEN' ? ' • sincronizado' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium text-slate-500">
                      {formatUpcomingDate(activity.date)}
                      {activity.time ? ` • ${activity.time}` : ''}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-slate-500 hover:text-red-500"
                      onClick={() => onDeleteUpcomingActivity(activity.id)}
                      title="Eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">
                No tienes actividades próximas. Agrega una o define una fecha de examen en una materia.
              </p>
            )}
          </div>
        </div>
        <div className="glass-effect-light p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Tutorías Agendadas</h3>
          <div className="space-y-4">
            {upcomingActivities.some(a => a.type === 'TUTORIA') ? (
              sortedActivities.filter(a => a.type === 'TUTORIA').map((tutoria) => (
                <div key={tutoria.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">
                      {tutoria.tutorName ? `Tutoría con ${tutoria.tutorName}` : tutoria.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tutoria.curso_titulo || tutoria.subjectName || 'Tema: Tutoría General'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right mr-1">
                      <span className="block text-sm font-medium text-slate-500">
                        {formatUpcomingDate(tutoria.date)}
                      </span>
                      <span className="block text-xs text-slate-400">{tutoria.time}</span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
                        {tutoria.status || 'Confirmada'}
                      </span>
                      <button
                        type="button"
                        className="text-[10px] text-slate-400 hover:text-red-500 underline"
                        onClick={() => onDeleteUpcomingActivity(tutoria.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p className="mb-4">No tienes tutorías agendadas.</p>
                <button className="text-primary hover:underline text-sm" onClick={() => navigateTo('tutorias')}>
                  Buscar tutorías disponibles
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PanelStudent;
