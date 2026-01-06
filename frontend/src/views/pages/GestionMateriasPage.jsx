import { useState } from 'react';

const emptySubject = {
  title: '',
  professor: '',
  school: '',
  description: '',
  level: 'BASICO',
  temario: [{ title: '', description: '' }]
};

const LEVEL_LABELS = {
  BASICO: 'Básico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado'
};

const GestionMateriasPage = ({ subjects, onCreate, onDelete, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState(emptySubject);

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData(emptySubject);
    setShowModal(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      title: subject.title || '',
      professor: subject.professor || '',
      school: subject.school || '',
      description: subject.description || '',
      level: (subject.level || 'BASICO').toString().toUpperCase(),
      temario: (subject.temario && subject.temario.length)
        ? subject.temario.map((t) => ({ title: t.title || '', description: t.description || '' }))
        : [{ title: '', description: '' }]
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData(emptySubject);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) return;

    const payload = {
      title: formData.title.trim(),
      professor: formData.professor.trim(),
      school: formData.school.trim(),
      description: formData.description.trim(),
      level: formData.level || 'BASICO',
      temario: formData.temario
        .filter((tema) => tema.title.trim())
        .map((tema, idx) => ({
          title: tema.title.trim(),
          description: (tema.description || '').trim(),
          order: idx
        }))
    };

    const result = editingSubject
      ? await onUpdate(editingSubject.id, payload)
      : await onCreate(payload);

    if (result) {
      closeModal();
    }
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar esta materia?')) {
      onDelete(id);
    }
  };

  const updateTemario = (index, key, value) => {
    setFormData((prev) => {
      const next = [...prev.temario];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, temario: next };
    });
  };

  const addUnidad = () => {
    setFormData((prev) => ({ ...prev, temario: [...prev.temario, { title: '', description: '' }] }));
  };

  const removeUnidad = (index) => {
    setFormData((prev) => ({ ...prev, temario: prev.temario.filter((_, i) => i !== index) }));
  };

  return (
    <div className="page active space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Materias</h1>
          <p className="text-slate-500 dark:text-slate-400">Administra el catálogo de materias disponibles.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="py-2 px-4 bg-primary text-white rounded-lg hover:opacity-90">
          Agregar Materia
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div key={subject.id} className="glass-effect-light p-6 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold bg-primary/15 text-primary py-1 px-2 rounded-full">
                {LEVEL_LABELS[(subject.level || '').toString().toUpperCase()] || subject.level || 'General'}
              </span>
              <span className="text-xs text-slate-500">{subject.school || '—'}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">{subject.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{subject.professor || 'Profesor'}</p>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{subject.description}</p>
            </div>
            <div className="flex gap-2 mt-auto">
              <button type="button" onClick={() => openEditModal(subject)} className="flex-1 py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-md">Editar</button>
              <button type="button" className="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-md" onClick={() => handleDelete(subject.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{editingSubject ? 'Editar Materia' : 'Nueva Materia'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-xl">×</button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nombre</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Profesor</label>
                  <input
                    type="text"
                    value={formData.professor}
                    onChange={(e) => setFormData((prev) => ({ ...prev, professor: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Escuela</label>
                  <input
                    type="text"
                    value={formData.school}
                    onChange={(e) => setFormData((prev) => ({ ...prev, school: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nivel</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
                    className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary outline-none"
                  >
                    <option value="BASICO">Básico</option>
                    <option value="INTERMEDIO">Intermedio</option>
                    <option value="AVANZADO">Avanzado</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary outline-none min-h-[80px]"
                  placeholder="Resumen que verán los estudiantes"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Unidades temáticas</label>
                  <button type="button" onClick={addUnidad} className="text-primary text-sm hover:underline">Añadir unidad</button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {formData.temario.map((tema, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tema.title}
                          onChange={(e) => updateTemario(idx, 'title', e.target.value)}
                          placeholder={`Unidad ${idx + 1}`}
                          className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-transparent focus:border-primary outline-none"
                        />
                        {formData.temario.length > 1 && (
                          <button type="button" onClick={() => removeUnidad(idx)} className="text-red-500 text-sm px-2">Eliminar</button>
                        )}
                      </div>
                      <textarea
                        value={tema.description}
                        onChange={(e) => updateTemario(idx, 'description', e.target.value)}
                        placeholder="Descripción opcional"
                        className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-transparent focus:border-primary outline-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="py-2 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 hover:opacity-80 transition-opacity">
                  Cancelar
                </button>
                <button type="submit" className="py-2 px-4 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity">
                  {editingSubject ? 'Guardar Cambios' : 'Crear Materia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionMateriasPage;
