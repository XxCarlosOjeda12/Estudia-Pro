const MisRecursosPage = ({ user, resources }) => {
  const myResources = resources.filter((res) => res.author === user?.name);
  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mis Recursos</h1>
        <p className="text-slate-500 dark:text-slate-400">Gestiona los recursos que has publicado.</p>
      </div>
      <button className="py-2 px-4 bg-primary text-white rounded-md w-fit">Crear Nuevo Recurso</button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {myResources.length ? (
          myResources.map((res) => (
            <div key={res.id} className="glass-effect-light p-6 rounded-2xl flex flex-col gap-3">
              <span className="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full self-start">{res.subjectName}</span>
              <h3 className="text-xl font-bold">{res.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{res.sales || 0} ventas</p>
              <div className="flex gap-2 mt-auto">
                <button className="flex-1 py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-md">Editar</button>
                <button className="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-md">Eliminar</button>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-3 text-center text-slate-500">Aún no has publicado recursos.</p>
        )}
      </div>
    </div>
  );
};

export default MisRecursosPage;
