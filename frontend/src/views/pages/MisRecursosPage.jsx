
import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';
import { resolveFileUrl } from '../../lib/url';

const MisRecursosPage = () => {
  const { pushToast } = useAppContext();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [previewResource, setPreviewResource] = useState(null);
  const [localFile, setLocalFile] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'DOCUMENTO',
    archivo_url: '',
    contenido_texto: ''
  });

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyCommunityResources();
      setResources(data);
    } catch (error) {
      console.error(error);
      pushToast({ title: 'Error', message: 'No se pudieron cargar tus recursos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (res) => {
    setEditingResource(res);
    setFormData({
      titulo: res.titulo,
      descripcion: res.descripcion,
      tipo: res.tipo,
      archivo_url: res.archivo_url || '',
      contenido_texto: res.contenido_texto || ''
    });
    setLocalFile(null);
    setShowModal(true);
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este recurso? Esta acción no se puede deshacer.')) return;
    try {
      await apiService.deleteCommunityResource(resourceId);
      pushToast({ title: 'Eliminado', message: 'Recurso eliminado correctamente', type: 'success' });
      fetchResources();
    } catch (error) {
      pushToast({ title: 'Error', message: error.message || 'Error al eliminar recurso', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let payload = formData;
      if (localFile) {
        payload = new FormData();
        payload.append('titulo', formData.titulo);
        payload.append('descripcion', formData.descripcion);
        payload.append('tipo', formData.tipo);
        payload.append('contenido_texto', formData.contenido_texto || '');
        if (formData.archivo_url) payload.append('archivo_url', formData.archivo_url);
        payload.append('archivo', localFile);
      }

      if (editingResource) {
        await apiService.updateCommunityResource(editingResource.id, payload);
        pushToast({ title: 'Éxito', message: 'Recurso actualizado correctamente', type: 'success' });
      } else {
        await apiService.createCommunityResource(payload);
        pushToast({ title: 'Éxito', message: 'Recurso creado correctamente', type: 'success' });
      }

      closeModal();
      fetchResources();
    } catch (error) {
      pushToast({ title: 'Error', message: error.message || 'Error al procesar el recurso', type: 'error' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingResource(null);
    setFormData({ titulo: '', descripcion: '', tipo: 'DOCUMENTO', archivo_url: '', contenido_texto: '' });
    setLocalFile(null);
  };

  return (
    <div className="page active space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Recursos</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona los recursos que has publicado para la comunidad.</p>
        </div>
        <button
          onClick={() => { closeModal(); setShowModal(true); }}
          className="py-2 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl shadow-lg shadow-primary/20 transition-all transform hover:scale-105 font-semibold"
        >
          + Crear Nuevo Recurso
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando recursos...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.length ? (
            resources.map((res) => (
              <div key={res.id} className="glass-effect-light p-6 rounded-2xl flex flex-col gap-3 border border-slate-200 dark:border-white/5 transition-all hover:border-primary/30 group">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold bg-primary/10 text-primary py-1 px-3 rounded-full uppercase tracking-wider">
                    {res.tipo}
                  </span>
                  <div className="flex gap-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${res.aprobado ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {res.aprobado ? 'Aprobado' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{res.titulo}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{res.descripcion}</p>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setPreviewResource(res)}
                    className="flex-1 py-1.5 text-xs bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-colors font-medium"
                  >
                    Vista Previa
                  </button>
                  <button
                    onClick={() => handleEdit(res)}
                    className="flex-1 py-1.5 text-xs bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors font-medium border border-blue-500/20"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                    title="Eliminar"
                  >
                    Eliminar
                  </button>
                </div>

                <div className="mt-4 pt-4 flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 border-t border-slate-200 dark:border-white/5">
                  <span className="flex items-center gap-1.5">
                    <span className="opacity-50">Descargas:</span> {res.descargas || 0}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="opacity-50">Rating:</span>⭐ {res.calificacion_promedio || '0.0'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 glass-effect-light rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <p className="text-4xl mb-4">📂</p>
              <p className="text-xl font-semibold mb-2">Aún no has publicado recursos</p>
              <p className="text-slate-500">Sube apuntes, guías o exámenes para ayudar a otros estudiantes.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{editingResource ? 'Editar Recurso' : 'Publicar Recurso'}</h2>
                  <p className="text-sm text-slate-500">Comparte tu conocimiento con la comunidad.</p>
                </div>
                <button onClick={closeModal} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  type="text"
                  name="titulo"
                  required
                  value={formData.titulo}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ej: Resumen de Cálculo Diferencial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="DOCUMENTO">Documento PDF/Word</option>
                  <option value="VIDEO">Video</option>
                  <option value="ENLACE">Enlace Externo</option>
                  <option value="CODIGO">Código / Script</option>
                  <option value="PRESENTACION">Presentación</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  required
                  rows="3"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none resize-none"
                  placeholder="Describe qué contiene este recurso..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL del Archivo / Enlace</label>
                <input
                  type="text"
                  name="archivo_url"
                  value={formData.archivo_url}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none font-mono text-xs"
                  placeholder="https://drive.google.com/ o ruta interna"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{editingResource ? 'Reemplazar Archivo' : 'Subir Archivo'} (opcional)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                  onChange={(event) => setLocalFile(event.target.files?.[0] || null)}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Si subes un archivo, este tendrá prioridad sobre la URL.</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all font-bold"
                >
                  {editingResource ? 'Guardar Cambios' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewResource && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-3xl overflow-hidden relative shadow-2xl border border-white/10">
            <header className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
              <div>
                <h3 className="font-bold text-lg">{previewResource.titulo}</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest">{previewResource.tipo}</p>
              </div>
              <button
                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"
                onClick={() => setPreviewResource(null)}
              >
                ✕
              </button>
            </header>

            <div className="p-4">
              <div className="h-[60vh] w-full bg-slate-100 dark:bg-black/30 rounded-xl overflow-hidden border border-slate-200 dark:border-white/5">
                {(previewResource.archivo_url || previewResource.contenido_url) ? (
                  <iframe
                    src={resolveFileUrl(previewResource.archivo_url || previewResource.contenido_url)}
                    className="w-full h-full"
                    title="Vista Previa"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 italic">
                    <span className="text-5xl mb-4">📄</span>
                    Vista previa no disponible para este tipo de recurso o sin URL válida.
                  </div>
                )}
              </div>
            </div>

            <footer className="p-4 border-t border-slate-200 dark:border-white/10 flex justify-end">
              <button
                className="px-6 py-2 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 rounded-lg font-bold transition-all"
                onClick={() => setPreviewResource(null)}
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisRecursosPage;
