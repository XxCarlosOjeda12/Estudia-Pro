import { useAppContext } from '../../context/AppContext.jsx';

const FormulariosPage = ({ formularies }) => {
  const { pushToast } = useAppContext();

  const handleOpen = (form) => {
    pushToast({ title: 'Formulario', message: `Abriendo ${form.title} (demo).`, type: 'info' });
    if (form.url && form.url !== '#') window.open(form.url, '_blank');
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Formularios de Estudio</h1>
        <p className="text-slate-500 dark:text-slate-400">Compendios de fórmulas esenciales para tus materias.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {formularies.length ? (
          formularies.map((form) => (
            <button
              key={form.id}
              type="button"
              onClick={() => handleOpen(form)}
              className="glass-effect-light p-6 rounded-2xl text-left hover:shadow-lg hover:-translate-y-1 transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">📄</div>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{form.subject}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{form.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">PDF • Descarga inmediata</p>
            </button>
          ))
        ) : (
          <p className="col-span-3 text-center text-slate-500">No hay formularios disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default FormulariosPage;
