import { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { apiService } from '../../lib/api';
import { API_CONFIG } from '../../lib/constants.js';
import { getDemoFile } from '../../lib/demoFileStore.js';
import SubscriptionModal from '../../components/SubscriptionModal.jsx';

const normalize = (value) => (value || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getBackendOrigin = () => API_CONFIG.BASE_URL.replace(/\/api\/?$/, '');

const resolveFileUrl = (rawUrl) => {
  if (!rawUrl || rawUrl === '#') return null;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
  if (rawUrl.startsWith('/')) return `${getBackendOrigin()}${rawUrl}`;
  return rawUrl;
};

const downloadBlob = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename || 'archivo';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

const clickDownloadLink = (url, filename) => {
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noreferrer';
  link.target = '_blank';
  if (filename) link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const RecursosPage = ({ resources, purchasedResources, onPurchase }) => {
  const { pushToast, demoEnabled, user, loadProfile } = useAppContext();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [preview, setPreview] = useState(null);
  const [visibleCount, setVisibleCount] = useState(9);
  const purchasedIds = new Set(purchasedResources.map((res) => res.id));

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  // Check if user is premium
  const isPremium = user?.is_premium || user?.premium;

  const filtered = useMemo(() => {
    const term = normalize(search);
    return resources.filter((resource) => {
      const matchesSearch = !term || normalize(resource.title).includes(term);
      const matchesSubject = subjectFilter === 'all' || normalize(resource.subjectName).includes(normalize(subjectFilter));
      const matchesType = typeFilter === 'all' || resource.type === typeFilter;
      return matchesSearch && matchesSubject && matchesType;
    });
  }, [resources, search, subjectFilter, typeFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(9);
  }, [search, subjectFilter, typeFilter]);

  const visibleResources = filtered.slice(0, visibleCount);

  const handleDownload = async (resource) => {
    pushToast({ title: 'Descarga', message: `Descargando ${resource.title}.`, type: 'info' });
    try {
      if (resource.source === 'community') {
        const response = await apiService.downloadCommunityResource(resource.id);
        const fileId = response?.fileId;
        const url = resolveFileUrl(response?.url || resource.archivo_url || resource.contenido_url);

        if (demoEnabled && fileId) {
          const stored = await getDemoFile(fileId);
          if (!stored?.blob) throw new Error('No se encontró el archivo del recurso (demo).');
          downloadBlob(stored.blob, stored.name || resource.title || 'recurso');
          pushToast({ title: 'Descarga', message: 'Descarga iniciada.', type: 'success' });
          return;
        }

        if (url) {
          const downloadName = `${resource.title || 'recurso'}.pdf`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`No se pudo descargar (${res.status})`);
          const blob = await res.blob();
          downloadBlob(blob, downloadName);
          pushToast({ title: 'Descarga', message: 'Descarga iniciada.', type: 'success' });
          return;
        }

        throw new Error('Este recurso no tiene archivo para descargar.');
      }

      const url = resolveFileUrl(resource.archivo_url || resource.contenido_url || resource.url);
      if (url) {
        clickDownloadLink(url, resource.title || 'recurso');
        pushToast({ title: 'Descarga', message: 'Descarga iniciada.', type: 'success' });
        return;
      }
      await apiService.markResourceCompleted(resource.id);
      pushToast({ title: 'Progreso', message: 'Recurso marcado como visto.', type: 'success' });
    } catch (error) {
      console.error('Error marking completed:', error);
      pushToast({ title: 'Descarga', message: error?.message || 'No se pudo descargar.', type: 'alert' });
    }
  };

  const handlePurchaseClick = () => {
    setShowSubscriptionModal(true);
  };

  const onSubscriptionSuccess = async () => {
    localStorage.setItem('estudia_pro_premium', 'true');
    try {
      const data = await apiService.activatePremium();
      if (data.success || data.is_premium) {
        // Refresh user profile to get updated premium status
        await loadProfile();
        setShowSubscriptionModal(false);
        pushToast({ title: '¡Felicidades!', message: 'Ahora eres Premium.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      pushToast({ title: 'Error', message: 'No se pudo activar premium.', type: 'alert' });
    }
  };

  return (
    <div className="page active space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recursos de la Comunidad</h1>
          <p className="text-slate-500 dark:text-slate-400">Apuntes, guías y exámenes compartidos por otros estudiantes.</p>
          {!isPremium && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-yellow-600 dark:text-yellow-400 font-bold">Modo Gratuito</p>
                <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">Suscríbete para acceder a las vistas previas de los documentos.</p>
              </div>
            </div>
          )}
        </div>

        {/* Access Denied Modal Logic dealt with by SubscriptionModal internal flow */}
      </div>

      {/* Filters */}
      <div className="glass-effect-light p-4 rounded-2xl flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-3 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar recursos..."
            className="w-full pl-10 pr-4 py-2 bg-transparent border-none outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-transparent border-l border-slate-200 dark:border-slate-700 px-4 py-2 outline-none"
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
          className="bg-transparent border-l border-slate-200 dark:border-slate-700 px-4 py-2 outline-none"
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
        {visibleResources.map((resource) => {
          const isPurchased = isPremium || purchasedIds.has(resource.id) || resource.free;
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
                    className="flex-1 text-center py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-emerald-500/20 transition-all"
                    onClick={() => handleDownload(resource)}
                  >
                    Descargar
                  </button>
                ) : (
                  <button
                    className="flex-1 text-center py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                    onClick={handlePurchaseClick}
                  >
                    <span>Descargar</span>
                    <span>🔒</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount(prev => prev + 9)}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            <span>Cargar más recursos</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
      )}

      {showSubscriptionModal && (
        <SubscriptionModal
          onClose={() => setShowSubscriptionModal(false)}
          onSuccess={onSubscriptionSuccess}
        />
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
              {(isPremium || purchasedIds.has(preview.id) || preview.free) ? (
                <div className="h-96 w-full flex items-center justify-center bg-white/5 rounded-lg">
                  {preview.archivo_url || preview.contenido_url ? (
                    <iframe
                      src={resolveFileUrl(preview.archivo_url || preview.contenido_url)}
                      className="w-full h-full rounded-lg"
                    />
                  ) : (
                    <p>Vista previa no disponible (sin URL).</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="mb-4">🔒 Contenido bloqueado</p>
                  <button
                    onClick={() => { setPreview(null); setShowSubscriptionModal(true); }}
                    className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-bold"
                  >
                    Desbloquear con Premium
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button className="w-full py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600" onClick={() => setPreview(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecursosPage;
