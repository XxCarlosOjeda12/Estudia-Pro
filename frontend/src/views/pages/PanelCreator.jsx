const PanelCreator = ({ user, resources, tutoringRequests = [], navigateTo, onDeleteUpcomingActivity }) => {
  const creatorResources = resources.filter((res) => res.author === user?.name);
  const creatorProfile = user?.raw?.perfil_creador || {};
  const stats = user?.raw?.dashboard || {};

  return (
    <div className="page active space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de Creador</h1>
        <p className="text-slate-500 dark:text-slate-400">Bienvenido, {user?.name}. Gestiona tus recursos y tutorías.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-effect-light p-5 rounded-2xl text-center">
          <p className="text-xs uppercase text-slate-500 tracking-widest">Recursos Publicados</p>
          <p className="text-4xl font-bold text-primary mt-2">{stats.published ?? creatorResources.length}</p>
        </div>
        <div className="glass-effect-light p-5 rounded-2xl text-center">
          <p className="text-xs uppercase text-slate-500 tracking-widest">Rating Promedio</p>
          <p className="text-4xl font-bold text-primary mt-2">{stats.rating ?? creatorProfile.calificacion_promedio ?? '—'}</p>
        </div>
        <div className="glass-effect-light p-5 rounded-2xl text-center">
          <p className="text-xs uppercase text-slate-500 tracking-widest">Estudiantes Ayudados</p>
          <p className="text-4xl font-bold text-primary mt-2">{stats.studentsHelped ?? creatorProfile.num_resenas ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-effect-light p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Tus Recursos</h2>
            <button className="text-sm text-primary hover:underline" onClick={() => navigateTo('mis-recursos')}>
              Gestionar
            </button>
          </div>
          {creatorResources.length ? (
            <ul className="space-y-3">
              {creatorResources.slice(0, 4).map((res) => (
                <li key={res.id} className="flex items-center justify-between text-sm">
                  <span>{res.title}</span>
                  <span className="text-slate-400">{res.sales || res.downloads || 0} ventas</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">Aún no has publicado recursos.</p>
          )}
        </div>
        <div className="glass-effect-light p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Solicitudes de Tutorías</h2>
            <button className="text-sm text-primary hover:underline" onClick={() => navigateTo('tutorias')}>
              Gestionar
            </button>
          </div>
          {tutoringRequests?.length ? (
            <ul className="space-y-4">
              {tutoringRequests.slice(0, 3).map((item) => (
                <li key={item.id} className="p-3 bg-white/50 dark:bg-slate-800/30 border border-slate-200 dark:border-white/10 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.student}</p>
                      <p className="text-xs text-slate-500">@{item.studentUsername || 'usuario'}</p>
                      <p className="text-xs text-slate-400">{item.studentEmail || 'email no disponible'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full shrink-0">{item.duration}</span>
                      <button
                        type="button"
                        className="text-[10px] text-slate-400 hover:text-red-500 underline"
                        onClick={() => onDeleteUpcomingActivity(`tut-${item.id}`)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">
                    <p><strong>Tema:</strong> {item.subject}</p>
                    <p><strong>Fecha:</strong> {item.date}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No tienes tutorías programadas.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PanelCreator;
