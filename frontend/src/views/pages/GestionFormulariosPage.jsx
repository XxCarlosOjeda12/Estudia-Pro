import { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

const GestionFormulariosPage = ({ formularies, onCreate, onDelete, onUpdate }) => {
  const { pushToast } = useAppContext();
  const list = useMemo(() => (Array.isArray(formularies) ? formularies : []), [formularies]);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  // Edit state
  const [editingForm, setEditingForm] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editUrl, setEditUrl] = useState('');

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
        payload.append('titulo', title.trim());
        payload.append('materia', subject.trim()); // Fixed field name to match model
        payload.append('archivo', file);
        await onCreate(payload);
      } else {
        await onCreate({ titulo: title.trim(), materia: subject.trim(), archivo_url: url.trim() });
      }
      setTitle('');
      setSubject('');
      setFile(null);
      setUrl('');
      pushToast({ title: 'Formulario', message: 'Formulario creado exitosamente.', type: 'success' });
    } catch (error) {
      pushToast({ title: 'Formularios', message: error?.message || 'No se pudo crear el formulario.', type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (form) => {
    setEditingForm(form);
    setEditTitle(form.title || '');
    setEditSubject(form.subject || '');
    setEditUrl(form.url || '');
    setEditFile(null);
  };

  const updateForm = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('titulo', editTitle.trim());
      payload.append('materia', editSubject.trim());
      if (editFile) {
        payload.append('archivo', editFile);
      } else if (editUrl.trim() && editUrl !== editingForm.url) {
        payload.append('archivo_url', editUrl.trim());
      }

      if (onUpdate) {
        await onUpdate(editingForm.id, payload);
        pushToast({ title: 'Actualización', message: 'Formulario actualizado correctamente.', type: 'success' });
        setEditingForm(null);
      }
    } catch (error) {
      pushToast({ title: 'Error', message: 'No se pudo actualizar.', type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  const deleteForm = (form) => {
    if (confirm(`¿Estás seguro de eliminar "${form.title}"?`)) {
      if (onDelete) onDelete(form.id);
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
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 hidden md:inline">{form.type || 'PDF'}</span>
                  <button className="text-blue-500 text-sm hover:underline" onClick={() => handleEditClick(form)}>Editar</button>
                  <button className="text-red-500 text-sm hover:underline" onClick={() => deleteForm(form)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500">Aún no hay formularios publicados.</p>
        )}
      </div>

      {editingForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingForm(null)} />
          <div className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-lg shadow-xl">
            <h3 className="text-lg font-bold mb-4">Editar Formulario</h3>
            <form onSubmit={updateForm} className="space-y-4">
              <div>
                <label className="text-xs text-slate-500">Título</label>
                <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full p-2 border rounded bg-transparent" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Materia</label>
                <input type="text" value={editSubject} onChange={e => setEditSubject(e.target.value)} className="w-full p-2 border rounded bg-transparent" />
              </div>
              <div>
                <label className="text-xs text-slate-500">Reemplazar Archivo (PDF)</label>
                <input type="file" accept="application/pdf" onChange={e => setEditFile(e.target.files[0])} className="w-full p-2 border rounded bg-transparent" />
                <p className="text-[10px] text-slate-400 mt-1">Sube un archivo solo si deseas reemplazar el actual.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingForm(null)} className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-primary text-white">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionFormulariosPage;

