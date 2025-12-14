
import { useState, useEffect } from 'react';
import { apiService } from '../../lib/api';
import { useAppContext } from '../../context/AppContext';

const MisRecursosPage = () => {
  const { pushToast, user } = useAppContext();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createCommunityResource(formData);
      pushToast({ title: 'Éxito', message: 'Recurso creado correctamente', type: 'success' });
      setShowModal(false);
      setFormData({ titulo: '', descripcion: '', tipo: 'DOCUMENTO', archivo_url: '', contenido_texto: '' });
      fetchResources();
    } catch (error) {
      pushToast({ title: 'Error', message: error.message || 'Error al crear recurso', type: 'error' });
    }
  };

  return (
    <div className="page active space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Recursos</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona los recursos que has publicado para la comunidad.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
              <div key={res.id} className="glass-effect-light p-6 rounded-2xl flex flex-col gap-3 border border-slate-200 dark:border-white/5 transition-all hover:border-primary/30">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-semibold bg-primary/10 text-primary py-1 px-3 rounded-full uppercase tracking-wider">
                    {res.tipo}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${res.aprobado ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {res.aprobado ? 'Aprobado' : 'Pendiente'}
                  </span>
                </div>

                <h3 className="text-xl font-bold leading-tight">{res.titulo}</h3>
                <p className="text-sm text-slate-500 line-clamp-2">{res.descripcion}</p>

                <div className="mt-auto pt-4 flex items-center justify-between text-sm text-slate-400 border-t border-slate-200 dark:border-white/5">
                  <span className="flex items-center gap-1">
                    ⬇ {res.descargas || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    ⭐ {res.calificacion_promedio || '0.0'}
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

      {/* Modal de Creación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-2xl font-bold">Publicar Recurso</h2>
              <p className="text-sm text-slate-500">Comparte tu conocimiento con la comunidad.</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                  type="url"
                  name="archivo_url"
                  value={formData.archivo_url}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisRecursosPage;
