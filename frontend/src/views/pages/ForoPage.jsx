import { useState } from 'react';
import { apiService } from '../../lib/api.js';
import { useAppContext } from '../../context/AppContext.jsx';

const ForoPage = ({ forums, subjects, onOpenTopic, onTopicCreated }) => {
  const { user, pushToast } = useAppContext();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title || !subjectId || !content) {
      pushToast({ title: 'Foro', message: 'Completa todos los campos.', type: 'alert' });
      return;
    }
    setLoading(true);
    try {
      const response = await apiService.createForumTopic({
        title,
        subjectId,
        content,
        author: user?.name
      });
      if (response?.topic) {
        onTopicCreated?.(response.topic);
        setTitle('');
        setSubjectId('');
        setContent('');
        pushToast({ title: 'Foro', message: 'Tu pregunta ha sido publicada.', type: 'success' });
      }
    } catch (error) {
      pushToast({ title: 'Foro', message: 'No se pudo crear el tema.', type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Foro de Ayuda</h1>
        <p className="text-slate-500 dark:text-slate-400">Comparte dudas y soluciones con otros estudiantes.</p>
      </div>
      <div className="glass-effect-light p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Temas de Discusión</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forums.map((forum) => (
            <button
              key={forum.id}
              type="button"
              className="p-4 rounded-xl border-l-4 border-primary/70 bg-white/80 dark:bg-slate-800/70 text-left hover:bg-primary/5"
              onClick={() => onOpenTopic(forum.id)}
            >
              <h3 className="font-semibold">{forum.title}</h3>
              <p className="text-sm text-slate-500">{forum.subjectName} • {forum.postCount || 0} respuestas</p>
            </button>
          ))}
        </div>
      </div>
      <div className="glass-effect-light p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Crear Nuevo Tema</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="¿Cuál es tu pregunta?"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Materia</label>
            <select
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
              required
            >
              <option value="">Selecciona una materia</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Pregunta</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows="4"
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
              placeholder="Describe tu duda con detalle..."
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Publicando...' : 'Publicar Pregunta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForoPage;
