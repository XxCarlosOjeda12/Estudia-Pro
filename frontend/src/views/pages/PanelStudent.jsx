import { HARDCODED_DATA } from '../../lib/constants.js';
import { apiService } from '../../lib/api.js';
import { useAppContext } from '../../context/AppContext.jsx';

const PanelStudent = ({ user, subjects, notifications, navigateTo }) => {
  const { refreshNotifications } = useAppContext();
  const activities = HARDCODED_DATA.activities.upcoming;

  const markRead = async (id) => {
    await apiService.markNotificationAsRead(id);
    await refreshNotifications();
  };

  return (
    <div className="page active space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido, {user?.name}</h1>
          <p className="text-slate-600 dark:text-slate-400">Aquí tienes un resumen de tu actividad.</p>
        </div>
        <div className="glass-effect-light p-3 rounded-xl text-sm min-w-[180px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold text-primary">🔔 Notificaciones</span>
            {notifications?.some((n) => !n.read) && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notifications.filter((n) => !n.read).length}
              </span>
            )}
          </div>
          <div className="mt-2 space-y-2 max-h-36 overflow-y-auto">
            {notifications?.length ? notifications.map((notif) => (
              <div key={notif.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-100 dark:bg-slate-900/20 p-2 border border-slate-200 dark:border-white/5">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{notif.title}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{notif.message}</p>
                </div>
                {!notif.read && (
                  <button className="text-[11px] text-primary hover:underline" onClick={() => markRead(notif.id)}>Marcar</button>
                )}
              </div>
            )) : <p className="text-[11px] text-slate-500 dark:text-slate-400">Sin notificaciones.</p>}
          </div>
        </div>
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
                  <span className="text-xs text-slate-500">{subject.examDate ? `Examen: ${new Date(subject.examDate).toLocaleDateString('es-MX')}` : ''}</span>
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
          <h3 className="text-xl font-bold mb-4">Próximas Actividades</h3>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="font-semibold">{activity.title}</p>
                  <p className="text-xs text-slate-500">{activity.type}</p>
                </div>
                <span className="text-sm font-medium text-slate-500">{activity.date}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-effect-light p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Tutorías Agendadas</h3>
          <div className="text-center py-8 text-slate-500">
            <p className="mb-4">No tienes tutorías agendadas.</p>
            <button className="text-primary hover:underline text-sm" onClick={() => navigateTo('tutorias')}>
              Buscar tutorías disponibles
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PanelStudent;
