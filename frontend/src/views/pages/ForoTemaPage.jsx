import { useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

const ForoTemaPage = ({ topic, onBack, onReply }) => {
  const { pushToast } = useAppContext();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!topic) {
    return (
      <div className="page active">
        <button className="text-primary hover:underline" onClick={onBack}>Volver al foro</button>
        <p className="mt-4 text-slate-500">Selecciona un tema para continuar.</p>
      </div>
    );
  }

  const handleReply = async (event) => {
    event.preventDefault();
    if (!message) return;
    setLoading(true);
    try {
      await onReply(topic.id, message);
      setMessage('');
      pushToast({ title: 'Foro', message: 'Respuesta publicada.', type: 'success' });
    } catch {
      pushToast({ title: 'Foro', message: 'No se pudo publicar la respuesta.', type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active space-y-6">
      <button className="flex items-center text-sm text-primary hover:underline" onClick={onBack}>
        ← Volver al listado
      </button>
      <div className="glass-effect-light p-6 rounded-2xl">
        <p className="text-xs uppercase tracking-widest text-slate-500">{topic.subjectName}</p>
        <h1 className="text-3xl font-bold mt-2 mb-2">{topic.title}</h1>
        <p className="text-sm text-slate-500">{topic.posts?.length || 0} respuestas</p>
      </div>
      <div className="space-y-4">
        {(topic.posts || []).map((post) => (
          <article key={post.id} className="glass-effect-light p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold">{post.author}</p>
                <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString('es-MX')}</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{post.content}</p>
          </article>
        ))}
      </div>
      <div className="glass-effect-light p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-4">Responder al tema</h2>
        <form onSubmit={handleReply} className="space-y-4">
          <textarea
            className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
            rows="4"
            placeholder="Comparte tu respuesta o sugerencia..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar respuesta'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForoTemaPage;
