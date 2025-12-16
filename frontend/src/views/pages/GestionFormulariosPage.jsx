import { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

const GestionFormulariosPage = ({ formularies, onCreate }) => {
  const { pushToast } = useAppContext();
  const list = useMemo(() => (Array.isArray(formularies) ? formularies : []), [formularies]);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      pushToast({ title: 'Formularios', message: 'El título es requerido.', type: 'alert' });
      return;
    }
    if (!file && !url.trim()) {
      pushToast({ title: 'Formularios', message: 'Sube un PDF o pega una URL.', type: 'alert' });
      return;
    }

    setLoading(true);
    try {
      if (file) {
        const payload = new FormData();
        payload.append('title', title.trim());
        payload.append('subject', subject.trim());
        payload.append('file', file);
        await onCreate(payload);
      } else {
        await onCreate({ title: title.trim(), subject: subject.trim(), url: url.trim() });
      }
      setTitle('');
      setSubject('');
      setFile(null);
      setUrl('');
    } catch (error) {
      pushToast({ title: 'Formularios', message: error?.message || 'No se pudo crear el formulario.', type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Formularios (PDF)</h1>
        <p className="text-slate-500 dark:text-slate-400">Sube formularios para que los estudiantes los vean y descarguen al instante.</p>
      </div>

      <div className="glass-effect-light p-6 rounded-2xl space-y-4">
        <h2 className="text-xl font-bold">Subir nuevo formulario</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
              placeholder="Ej. Identidades trigonométricas"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500">Materia</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
              placeholder="Ej. Álgebra"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">PDF desde tu computadora</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
            />
            <p className="text-[11px] text-slate-500">Si subes PDF, no necesitas URL.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">URL (opcional)</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 bg-primary text-white rounded-md w-fit disabled:opacity-60"
            >
              {loading ? 'Subiendo...' : 'Publicar formulario'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-effect-light p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Formularios publicados</h2>
          <span className="text-sm text-slate-500">{list.length}</span>
        </div>
        {list.length ? (
          <div className="space-y-2">
            {list.map((form) => (
              <div key={form.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{form.title}</p>
                  <p className="text-xs text-slate-500 truncate">{form.subject}{form.fileName ? ` • ${form.fileName}` : ''}</p>
                </div>
                <span className="text-xs text-slate-500">{form.type || 'PDF'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">Aún no hay formularios publicados.</p>
        )}
      </div>
    </div>
  );
};

export default GestionFormulariosPage;

