import { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

const normalize = (value) => (value || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const RecursosPage = ({ resources, purchasedResources, onPurchase }) => {
  const { pushToast } = useAppContext();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [preview, setPreview] = useState(null);
  const purchasedIds = new Set(purchasedResources.map((res) => res.id));

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const filtered = useMemo(() => {
    const term = normalize(search);
    return resources.filter((resource) => {
      const matchesSearch = !term || normalize(resource.title).includes(term);
      const matchesSubject = subjectFilter === 'all' || normalize(resource.subjectName).includes(normalize(subjectFilter));
      const matchesType = typeFilter === 'all' || resource.type === typeFilter;
      return matchesSearch && matchesSubject && matchesType;
    });
  }, [resources, search, subjectFilter, typeFilter]);

  const handleDownload = (resource) => {
    pushToast({ title: 'Descarga', message: `Descargando ${resource.title} (demo).`, type: 'info' });
  };

  const handlePurchase = (resourceId) => {
    // Instead of immediately calling onPurchase, we show the subscription offer
    setShowSubscriptionModal(true);
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recursos de la Comunidad</h1>
        <p className="text-slate-500 dark:text-slate-400">Apuntes, guías y exámenes compartidos por otros estudiantes.</p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 space-y-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar recursos..."
              className="w-full p-3 pl-12 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Integrales', 'Matrices', 'Probabilidad'].map((chip) => (
              <button key={chip} type="button" className="px-3 py-1 text-xs rounded-full border border-slate-200 dark:border-slate-600" onClick={() => setSearch(chip)}>
                {chip}
              </button>
            ))}
          </div>
        </div>
        <select
          className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
          value={subjectFilter}
          onChange={(event) => setSubjectFilter(event.target.value)}
        >
          <option value="all">Todas las materias</option>
          {[...new Set(resources.map((res) => res.subjectName))].map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
        <select
          className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <option value="all">Todos los tipos</option>
          <option value="pdf">Guías/Resúmenes</option>
          <option value="exam">Exámenes</option>
          <option value="formula">Formularios</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((resource) => {
          const isPurchased = purchasedIds.has(resource.id) || resource.free;
          return (
            <div key={resource.id} className="glass-effect-light p-6 rounded-2xl flex flex-col">
              <span className="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full self-start">{resource.subjectName}</span>
              <h3 className="text-xl font-bold mt-3">{resource.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Por: {resource.author}</p>
              <div className="mt-auto flex gap-2">
                <button
                  className="flex-1 text-center py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-lg"
                  onClick={() => setPreview(resource)}
                >
                  Vista Previa
                </button>
                {isPurchased ? (
                  <button
                    className="flex-1 text-center py-2 px-4 bg-slate-200 dark:bg-slate-700 text-slate-500 font-semibold rounded-lg"
                    onClick={() => handleDownload(resource)}
                  >
                    Descargar
                  </button>
                ) : (
                  <button className="flex-1 text-center py-2 px-4 bg-secondary/80 hover:bg-secondary text-white font-semibold rounded-lg" onClick={() => handlePurchase(resource.id)}>
                    Adquirir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-900 border border-white/10 text-slate-100 rounded-2xl w-full max-w-md p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <button
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              onClick={() => setShowSubscriptionModal(false)}
            >
              ✕
            </button>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg shadow-primary/20">
                💎
              </div>

              <div>
                <h3 className="text-2xl font-bold">Desbloquea Todo</h3>
                <p className="text-primary font-medium">Plan Premium Estudia-Pro</p>
              </div>

              <p className="text-slate-400 leading-relaxed">
                Obtén acceso ilimitado a este recurso y a miles de guías, exámenes y formularios por una suscripción única.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                <p className="text-3xl font-bold text-white">$120 <span className="text-sm font-normal text-slate-400">/ mes</span></p>
                <p className="text-xs text-slate-500 mt-1">Cancela cuando quieras</p>
              </div>

              <button
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/25 mt-2"
                onClick={() => {
                  pushToast({ title: 'Redirigiendo', message: 'Iniciando proceso de suscripción...', type: 'success' });
                  setShowSubscriptionModal(false);
                }}
              >
                Suscribirme Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-2xl p-6 relative">
            <button className="absolute top-3 right-3 text-slate-400 hover:text-white" onClick={() => setPreview(null)}>✕</button>
            <p className="text-xs uppercase text-slate-400 mb-1">{preview.subjectName}</p>
            <h3 className="text-2xl font-bold mb-2">{preview.title}</h3>
            <p className="text-sm text-slate-400 mb-4">Por {preview.author} • {preview.type.toUpperCase()}</p>
            <div className="bg-slate-800/60 border border-white/5 rounded-xl p-4 mb-4 text-sm text-slate-200">
              Vista previa simulada (modo demo). Integra aquí tu visor PDF o embed real cuando conectes backend.
            </div>
            <div className="flex gap-3">
              <button className="flex-1 py-2 bg-primary text-white rounded-lg" onClick={() => setPreview(null)}>Cerrar</button>
              <button className="flex-1 py-2 bg-secondary text-white rounded-lg" onClick={() => handlePurchase(preview.id)}>Adquirir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecursosPage;
