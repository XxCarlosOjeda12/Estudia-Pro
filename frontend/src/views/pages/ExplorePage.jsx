import { useMemo, useState, useEffect } from 'react';
import { apiService } from '../../lib/api';

const normalize = (value) => (value || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const ExplorePage = ({ subjects, onAddSubject }) => {
  const [search, setSearch] = useState('');

  const [results, setResults] = useState(subjects);

  useEffect(() => {
    setResults(subjects);
  }, [subjects]);

  useEffect(() => {
    const term = normalize(search);
    if (!term) {
      setResults(subjects);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const data = await apiService.searchCourses(term);
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, subjects]);

  return (
    <div className="page active space-y-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Explorar Materias</h1>
      <div className="glass-effect-light p-6 rounded-2xl space-y-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Explora materias, temas o escuelas..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full p-3 pl-12 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Derivadas', 'Matrices', 'Probabilidad'].map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setSearch(chip)}
              className="px-3 py-1 text-xs rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-200 hover:border-primary hover:text-primary transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((subject) => (
          <div key={subject.id} className="glass-effect-light p-6 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold bg-primary/15 text-primary py-1 px-2 rounded-full">{subject.level || 'General'}</span>
              <span className="text-xs text-slate-500">{subject.school || 'ESCOM'}</span>
            </div>
            <h3 className="text-xl font-bold mb-2">{subject.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{subject.description}</p>
            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-4">
              {(subject.temario || []).slice(0, 3).map((item) => (
                <li key={item.title}>• {item.title}</li>
              ))}
            </ul>
            <button
              type="button"
              className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary-focus transition-colors"
              onClick={() => onAddSubject(subject.id)}
            >
              Añadir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplorePage;
