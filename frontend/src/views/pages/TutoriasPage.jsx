const TutoriasPage = ({ userRole, tutors }) => {
  if (userRole === 'creador') {
    return (
      <div className="page active space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Tutorías</h1>
          <p className="text-slate-500 dark:text-slate-400">Configura tu disponibilidad y tarifas como tutor.</p>
        </div>
        <div className="glass-effect-light p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold">Tarifas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" placeholder="Tarifa 30 min (MXN)" className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl" />
            <input type="number" placeholder="Tarifa 60 min (MXN)" className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl" />
          </div>
          <button className="py-2 px-4 bg-primary text-white rounded-md w-fit">Actualizar Tarifas</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tutorías Disponibles</h1>
        <p className="text-slate-500 dark:text-slate-400">Conecta con tutores expertos en cada materia.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutors.map((tutor) => (
          <div key={tutor.id} className="glass-effect-light p-6 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                {tutor.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <h3 className="font-semibold">{tutor.name}</h3>
                <p className="text-sm text-slate-500">{tutor.specialties}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{tutor.bio}</p>
            <p className="text-sm"><strong>Tarifas:</strong> ${tutor.tariff30} (30min) / ${tutor.tariff60} (60min)</p>
            <button className="w-full py-2 bg-primary/80 hover:bg-primary text-white rounded-md">Agendar Tutoría</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TutoriasPage;
