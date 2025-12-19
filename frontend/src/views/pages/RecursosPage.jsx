import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { apiService } from '../../lib/api';
import { API_CONFIG } from '../../lib/constants.js';
import { getDemoFile } from '../../lib/demoFileStore.js';

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

const RecursosPage = ({ resources, purchasedResources }) => {
  const { pushToast, demoEnabled } = useAppContext();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [preview, setPreview] = useState(null);
  const purchasedIds = new Set(purchasedResources.map((res) => res.id));

  // --- New State for Subscription Flow ---
  const [isSubscribed, setIsSubscribed] = useState(false); // Mock subscription state
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingResource, setPendingResource] = useState(null);

  // --- Preview Logic State ---
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (!preview) return;
    let activeUrl = null;
    let cancelled = false;

    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewUrl(null);
      try {
        if (demoEnabled && preview.fileId) {
          const stored = await getDemoFile(preview.fileId);
          if (!stored?.blob) {
            // Fallback if no demo blob found but we want to show something?
            // For now just error or empty
            console.warn('Demo file blob not found for', preview.title);
          } else {
            activeUrl = URL.createObjectURL(stored.blob);
            if (cancelled) return;
            setPreviewUrl(activeUrl);
            return;
          }
        }

        // Normal flow or fallback
        const urlToResolve = preview.archivo_url || preview.contenido_url || preview.url;
        const resolved = resolveFileUrl(urlToResolve);
        if (cancelled) return;
        setPreviewUrl(resolved);
      } catch (error) {
        console.error('Error loading preview:', error);
        pushToast({ title: 'Vista Previa', message: 'No se pudo cargar el archivo.', type: 'alert' });
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [preview, demoEnabled, pushToast]);

  // Existing "Offer" modal logic replaced/integrated above.

  const filtered = useMemo(() => {
    const term = normalize(search);
    return resources.filter((resource) => {
      const matchesSearch = !term || normalize(resource.title).includes(term);
      const matchesSubject = subjectFilter === 'all' || normalize(resource.subjectName).includes(normalize(subjectFilter));
      const matchesType = typeFilter === 'all' || resource.type === typeFilter;
      return matchesSearch && matchesSubject && matchesType;
    });
  }, [resources, search, subjectFilter, typeFilter]);

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

  const handlePreviewRequest = (resource) => {
    if (isSubscribed) {
      setPreview(resource);
    } else {
      setPendingResource(resource);
      setShowAccessDeniedModal(true);
    }
  };

  const handleOpenPayment = () => {
    setShowAccessDeniedModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    // Mock processing
    pushToast({ title: 'Procesando pago...', message: 'Validando tarjeta...', type: 'info' });

    setTimeout(() => {
      setIsSubscribed(true);
      setShowPaymentModal(false);
      pushToast({ title: 'Suscripción Activada', message: '¡Gracias por suscribirte!', type: 'success' });

      if (pendingResource) {
        setPreview(pendingResource);
        setPendingResource(null);
      }
    }, 1500);
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Recursos de la Comunidad</h1>
        <p className="text-slate-500 dark:text-slate-400">Apuntes, guías y exámenes compartidos por otros estudiantes.</p>
        {!isSubscribed && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-yellow-600 dark:text-yellow-400 font-bold">Modo Gratuito</p>
              <p className="text-sm text-yellow-600/80 dark:text-yellow-400/80">Suscríbete para acceder a las vistas previas de los documentos.</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters & Search - Unchanged */}
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
                  onClick={() => handlePreviewRequest(resource)}
                >
                  Vista Previa
                </button>
                {/* 
                  Use existing simple download if purchased, 
                  or just show download button anyway? 
                  The requirement was specifically about "Vista previa" triggering subscription.
                  We'll leave download as is for now or maybe block it too? 
                  Assuming "Vista previa" is the main hook.
                */}
                {isPurchased ? (
                  <button
                    className="flex-1 text-center py-2 px-4 bg-slate-200 dark:bg-slate-700 text-slate-500 font-semibold rounded-lg"
                    onClick={() => handleDownload(resource)}
                  >
                    Descargar
                  </button>
                ) : (
                  /* Even "Adquirir" (Purchase individual) might not be what we want if we are pushing subscription.
                     But let's leave it as "Adquirir" for specific items, or maybe that also triggers sub?
                     User said: "cuando el usuario le de vista previa... mensaje... suscribir" 
                     So we focus on preview button. */
                  <button className="flex-1 text-center py-2 px-4 bg-secondary/80 hover:bg-secondary text-white font-semibold rounded-lg" onClick={() => handleDownload(resource)}>
                    {/* Using handleDownload here as it seems to be the "Get it" flow in original code or maybe I should trigger sub here too? Be safe, stick to preview request. */}
                    Descargar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Access Denied / Subscribe Prompt */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
            <button
              onClick={() => setShowAccessDeniedModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center text-3xl mx-auto">
                🔒
              </div>
              <h3 className="text-2xl font-bold">Acceso Restringido</h3>
              <p className="text-slate-500 dark:text-slate-400">
                Para ver la vista previa de este recurso y acceder a todo el contenido de la comunidad, necesitas una suscripción activa.
              </p>

              <div className="py-4">
                <button
                  onClick={handleOpenPayment}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all hover:scale-[1.02]"
                >
                  Suscribirse Ahora
                </button>
                <button
                  onClick={() => setShowAccessDeniedModal(false)}
                  className="w-full mt-3 py-2 text-slate-500 dark:text-slate-400 font-medium hover:underline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-light-border dark:border-dark-border pb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                💳 Realizar Pago
              </h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">Suscripción Pro</p>
                  <p className="text-xs text-slate-500">Acceso ilimitado mensual</p>
                </div>
                <p className="font-bold text-2xl text-primary">$120.00</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre en la tarjeta</label>
                  <input type="text" placeholder="Ej. Juan Pérez" className="w-full p-2.5 bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Número de tarjeta</label>
                  <input type="text" placeholder="0000 0000 0000 0000" className="w-full p-2.5 bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Vencimiento</label>
                    <input type="text" placeholder="MM/AA" className="w-full p-2.5 bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">CVC</label>
                    <input type="text" placeholder="123" className="w-full p-2.5 bg-transparent border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={handlePaymentSuccess}
                className="w-full py-3 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-[1.01] flex justify-center items-center gap-2"
              >
                <span>🔒</span> Pagar $120.00 MXN
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl w-full max-w-4xl p-6 relative h-[85vh] flex flex-col">
            <button className="absolute top-3 right-3 text-slate-400 hover:text-white" onClick={() => setPreview(null)}>✕</button>
            <p className="text-xs uppercase text-slate-400 mb-1">{preview.subjectName}</p>
            <h3 className="text-2xl font-bold mb-2">{preview.title}</h3>
            <p className="text-sm text-slate-400 mb-4">Por {preview.author} • {preview.type.toUpperCase()}</p>

            <div className="bg-slate-800/60 border border-white/5 rounded-xl flex-1 overflow-hidden relative">
              {previewLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <span className="animate-pulse">Cargando documento...</span>
                </div>
              ) : previewUrl ? (
                <iframe
                  title="Vista Previa de Recurso"
                  src={`${previewUrl}#page=1&toolbar=0&navpanes=0`}
                  className="w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 flex-col gap-2">
                  <span className="text-3xl">📄</span>
                  <span>No hay vista previa disponible para este documento.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button className="flex-1 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600" onClick={() => setPreview(null)}>Cerrar</button>
              <button
                className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                onClick={() => {
                  handleDownload(preview);
                }}
              >
                Descargar Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecursosPage;
