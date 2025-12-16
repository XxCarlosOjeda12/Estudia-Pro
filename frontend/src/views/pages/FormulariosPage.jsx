import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { API_CONFIG } from '../../lib/constants.js';
import { getDemoFile } from '../../lib/demoFileStore.js';

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

const FormulariosPage = ({ formularies }) => {
  const { pushToast, demoEnabled } = useAppContext();
  const list = useMemo(() => (Array.isArray(formularies) ? formularies : []), [formularies]);

  const [selected, setSelected] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadName, setDownloadName] = useState('formulario.pdf');
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (!selected) return;
    let activeUrl = null;
    let cancelled = false;

    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewUrl(null);
      setDownloadName(selected.fileName || `${selected.title || 'formulario'}.pdf`);
      try {
        if (demoEnabled && selected.fileId) {
          const stored = await getDemoFile(selected.fileId);
          if (!stored?.blob) throw new Error('No se encontró el archivo del formulario (demo).');
          activeUrl = URL.createObjectURL(stored.blob);
          if (cancelled) return;
          setPreviewUrl(activeUrl);
          setDownloadName(stored.name || selected.fileName || `${selected.title || 'formulario'}.pdf`);
          return;
        }

        const resolved = resolveFileUrl(selected.url);
        if (cancelled) return;
        setPreviewUrl(resolved);
      } catch (error) {
        pushToast({ title: 'Formulario', message: error?.message || 'No se pudo cargar la vista previa.', type: 'alert' });
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (activeUrl) URL.revokeObjectURL(activeUrl);
    };
  }, [selected, demoEnabled, pushToast]);

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

  const handleDownload = async () => {
    if (!selected) return;
    if (!previewUrl) {
      pushToast({ title: 'Formulario', message: 'Este formulario no tiene archivo disponible.', type: 'alert' });
      return;
    }
    if (demoEnabled) {
      const fallbackUrl = previewUrl || resolveFileUrl(selected.url);
      if (fallbackUrl) {
        clickDownloadLink(fallbackUrl, downloadName || `${selected.title || 'formulario'}.pdf`);
        pushToast({ title: 'Formulario', message: 'Descarga iniciada.', type: 'success' });
        return;
      }
      pushToast({ title: 'Formulario', message: 'Este formulario no tiene archivo disponible (demo).', type: 'alert' });
      return;
    }

    setDownloadLoading(true);
    try {
      const response = await fetch(previewUrl);
      if (!response.ok) throw new Error(`No se pudo descargar (${response.status})`);
      const blob = await response.blob();
      downloadBlob(blob, downloadName || 'formulario.pdf');
      pushToast({ title: 'Formulario', message: 'Descarga iniciada.', type: 'success' });
    } catch (error) {
      pushToast({ title: 'Formulario', message: error?.message || 'No se pudo descargar. Abriendo en otra pestaña.', type: 'alert' });
      window.open(previewUrl, '_blank');
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Formularios de Estudio</h1>
        <p className="text-slate-500 dark:text-slate-400">Compendios de fórmulas esenciales para tus materias.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.length ? (
          list.map((form) => (
            <button
              key={form.id}
              type="button"
              onClick={() => setSelected(form)}
              className="glass-effect-light p-6 rounded-2xl text-left hover:shadow-lg hover:-translate-y-1 transition"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">📄</div>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">{form.subject || 'General'}</span>
              </div>
              <h3 className="text-xl font-bold mb-2">{form.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">PDF • Vista previa + descarga</p>
            </button>
          ))
        ) : (
          <p className="col-span-3 text-center text-slate-500">No hay formularios disponibles.</p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-slate-900 border border-white/10 text-slate-100 rounded-2xl w-full max-w-4xl p-6 relative shadow-2xl">
            <button
              type="button"
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>

            <div className="mb-4">
              <p className="text-xs uppercase text-slate-400">{selected.subject || 'General'}</p>
              <h3 className="text-2xl font-bold">{selected.title}</h3>
            </div>

            <div className="bg-slate-800/60 border border-white/5 rounded-xl overflow-hidden">
              {previewLoading ? (
                <div className="p-8 text-center text-slate-400">Cargando vista previa…</div>
              ) : previewUrl ? (
                <iframe
                  title="Vista previa"
                  src={`${previewUrl}#page=1`}
                  className="w-full h-[70vh]"
                />
              ) : (
                <div className="p-8 text-center text-slate-400">
                  No hay archivo para vista previa.
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col md:flex-row gap-3 md:justify-end">
              {previewUrl ? (
                <button
                  type="button"
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg"
                  onClick={() => window.open(previewUrl, '_blank')}
                >
                  Abrir en pestaña
                </button>
              ) : null}
              <button
                type="button"
                disabled={!previewUrl || downloadLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-60"
                onClick={handleDownload}
              >
                {downloadLoading ? 'Descargando…' : 'Descargar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulariosPage;
