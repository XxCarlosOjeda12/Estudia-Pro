const PanelCreator = ({ user, resources, navigateTo }) => {
  const creatorResources = resources.filter((res) => res.author === user?.name);
  const stats = user?.raw?.dashboard || { tutoring: [] };

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
          <p className="text-4xl font-bold text-primary mt-2">{stats.rating ?? '4.8'}</p>
        </div>
        <div className="glass-effect-light p-5 rounded-2xl text-center">
          <p className="text-xs uppercase text-slate-500 tracking-widest">Estudiantes Ayudados</p>
          <p className="text-4xl font-bold text-primary mt-2">{stats.studentsHelped ?? 0}</p>
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
            <h2 className="text-xl font-bold">Tus Tutorías</h2>
            <button className="text-sm text-primary hover:underline" onClick={() => navigateTo('tutorias')}>
              Gestionar
            </button>
          </div>
          {stats.tutoring?.length ? (
            <ul className="space-y-3">
              {stats.tutoring.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-semibold">{item.student}</p>
                    <p className="text-slate-500">{item.subject} • {item.date}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{item.duration}</span>
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
