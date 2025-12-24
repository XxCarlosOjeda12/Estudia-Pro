import { useState } from 'react';

const GestionMateriasPage = ({ subjects, onCreate, onDelete, onUpdate }) => {
  const [title, setTitle] = useState('');
  const [professor, setProfessor] = useState('');
  const [school, setSchool] = useState('');
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title) return;

    if (editingId) {
      await onUpdate(editingId, { title, professor, school });
      setEditingId(null);
    } else {
      await onCreate({ title, professor, school });
    }
    setTitle('');
    setProfessor('');
    setSchool('');
  };

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setTitle(subject.title);
    setProfessor(subject.professor);
    setSchool(subject.school);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle('');
    setProfessor('');
    setSchool('');
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar esta materia?')) {
      onDelete(id);
    }
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestión de Materias</h1>
        <p className="text-slate-500 dark:text-slate-400">Administra el catálogo de materias disponibles.</p>
      </div>
      <form className="glass-effect-light p-6 rounded-2xl space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre" className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl" required />
          <input type="text" value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Profesor" className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl" />
          <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Escuela" className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className={`py-2 px-4 ${editingId ? 'bg-secondary' : 'bg-primary'} text-white rounded-md w-fit`}>
            {editingId ? 'Guardar Cambios' : 'Agregar Materia'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} className="py-2 px-4 bg-slate-500 text-white rounded-md w-fit">
              Cancelar Edición
            </button>
          )}
        </div>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => (
          <div key={subject.id} className={`glass-effect-light p-6 rounded-2xl flex flex-col gap-3 ${editingId === subject.id ? 'ring-2 ring-primary' : ''}`}>
            <div>
              <h3 className="text-xl font-bold">{subject.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{subject.professor} | {subject.school}</p>
            </div>
            <div className="flex gap-2 mt-auto">
              <button type="button" onClick={() => handleEdit(subject)} className="flex-1 py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-md">Editar</button>
              <button type="button" className="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-md" onClick={() => handleDelete(subject.id)}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestionMateriasPage;
