import { useState } from 'react';

const GestionRecursosPage = ({ resources, onDelete, onUpdate }) => {
    const [editingResource, setEditingResource] = useState(null);
    const [formData, setFormData] = useState({ title: '', description: '', type: 'DOCUMENTO', archivo_url: '' });
    const [filter, setFilter] = useState('');

    const handleDelete = (resource) => {
        if (confirm('¿Eliminar este recurso permanentemente?')) {
            onDelete(resource.id, resource.source);
        }
    };

    const handleEditClick = (resource) => {
        setEditingResource(resource);
        setFormData({
            title: resource.title || resource.titulo,
            description: resource.description || resource.descripcion,
            type: resource.type || resource.tipo,
            archivo_url: resource.url || resource.archivo_url
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('titulo', formData.title);
        data.append('descripcion', formData.description);
        data.append('tipo', formData.type);
        if (formData.archivo) {
            data.append('archivo', formData.archivo);
        }
        // If it's an external link type, we might still use archivo_url, 
        // but user asked for "Reemplazo de PDFs", so file priority.
        if (formData.archivo_url && !formData.archivo) {
            data.append('archivo_url', formData.archivo_url);
        }

        if (editingResource && onUpdate) {
            await onUpdate(editingResource.id, data, editingResource.source);
            setEditingResource(null);
        }
    };

    const filteredResources = resources.filter(r =>
        (r.title || r.titulo || '').toLowerCase().includes(filter.toLowerCase()) ||
        (r.author?.name || r.autor?.name || '').toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="page active space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Gestión de Recursos</h1>
                <p className="text-slate-500 dark:text-slate-400">Edita o elimina recursos de la comunidad.</p>
            </div>

            <div className="glass-effect-light p-4 rounded-2xl">
                <input
                    type="text"
                    placeholder="Buscar recurso por título o autor..."
                    className="w-full p-2 bg-transparent border-none outline-none"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            {editingResource && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingResource(null)} />
                    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-lg border border-light-border dark:border-dark-border">
                        <h3 className="text-xl font-bold mb-4">Editar Recurso</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Título</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-primary outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Descripción</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-primary outline-none"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Tipo</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-primary outline-none"
                                >
                                    <option value="DOCUMENTO">Documento</option>
                                    <option value="VIDEO">Video</option>
                                    <option value="ENLACE">Enlace</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Archivo (PDF/Video)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFormData({ ...formData, archivo: e.target.files[0] })}
                                    className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-primary outline-none"
                                    accept=".pdf,video/*,image/*"
                                />
                                <p className="text-xs text-slate-500 mt-1">Sube un nuevo archivo para reemplazar el actual.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">O URL del Archivo (opcional)</label>
                                <input
                                    type="text"
                                    value={formData.archivo_url}
                                    onChange={(e) => setFormData({ ...formData, archivo_url: e.target.value })}
                                    className="w-full p-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:border-primary outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setEditingResource(null)} className="flex-1 py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:opacity-80 transition-opacity">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 py-2 px-4 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-effect-light p-6 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-light-border dark:border-dark-border text-left">
                            <th className="py-2">Título</th>
                            <th className="py-2">Autor</th>
                            <th className="py-2">Tipo</th>
                            <th className="py-2">Descargas</th>
                            <th className="py-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredResources.map((resource) => (
                            <tr key={resource.id} className="border-b border-light-border dark:border-dark-border">
                                <td className="py-3 font-medium">{resource.title || resource.titulo}</td>
                                <td className="py-3 text-slate-500">{resource.author?.name || resource.autor?.name || 'Anónimo'}</td>
                                <td className="py-3">
                                    <span className="bg-secondary/20 text-secondary text-xs py-1 px-2 rounded-full uppercase">{resource.type || resource.tipo}</span>
                                </td>
                                <td className="py-3">{resource.downloads || resource.descargas || 0}</td>
                                <td className="py-3 space-x-2">
                                    <button className="text-blue-500 hover:underline" onClick={() => handleEditClick(resource)}>Editar</button>
                                    <button className="text-red-500 hover:underline" onClick={() => handleDelete(resource)}>Eliminar</button>
                                    {resource.archivo_url && (
                                        <a href={resource.archivo_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Ver</a>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredResources.length === 0 && (
                    <p className="text-center text-slate-500 py-8">No se encontraron recursos.</p>
                )}
            </div>
        </div>
    );
};

export default GestionRecursosPage;
