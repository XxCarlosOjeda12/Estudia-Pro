import { useMemo, useState } from 'react';
import ExamGeneratorModal from '../../components/ExamGeneratorModal.jsx';
import { apiService } from '../../lib/api';
import { useAppContext } from '../../context/AppContext.jsx';

const PanelAdmin = ({ user, subjects, resources, users, navigateTo, onExamsUpdated }) => {
  const { pushToast } = useAppContext();
  const [showExamModal, setShowExamModal] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);

  const calculusSubjects = useMemo(
    () => subjects.filter((s) => /c[aá]lculo/i.test(s.title || s.nombre || '')),
    [subjects]
  );

  const handleGenerateExam = async (payload) => {
    setLoadingExam(true);
    try {
      await apiService.generateSimulatorExam(payload);
      pushToast({ title: 'Exámenes', message: 'Simulador generado.', type: 'success' });
      setShowExamModal(false);
      if (onExamsUpdated) await onExamsUpdated();
    } catch (error) {
      pushToast({ title: 'Exámenes', message: error?.message || 'No se pudo generar.', type: 'alert' });
    } finally {
      setLoadingExam(false);
    }
  };

  return (
    <div className="page active space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-slate-500 dark:text-slate-400">Bienvenido, {user?.name}. Gestiona la plataforma.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-effect-light p-5 rounded-2xl text-center">
          <p className="text-xs uppercase text-slate-500 tracking-widest">Usuarios Registrados</p>
          <p className="text-4xl font-bold text-primary mt-2">{users.length}</p>
        </div>
        <div className="glass-effect-light p-5 rounded-2xl text-center">
          <p className="text-xs uppercase text-slate-500 tracking-widest">Materias en Catálogo</p>
          <p className="text-4xl font-bold text-primary mt-2">{subjects.length}</p>
        </div>
        <div className="glass-effect-light p-5 rounded-2xl text-center">
          <p className="text-xs uppercase text-slate-500 tracking-widest">Recursos Publicados</p>
          <p className="text-4xl font-bold text-primary mt-2">{resources.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-effect-light p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Gestión de Usuarios</h2>
            <button className="text-sm text-primary hover:underline" onClick={() => navigateTo('gestion-usuarios')}>
              Ver todos
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {users.slice(0, 5).map((u) => (
              <li key={u.id} className="flex items-center justify-between">
                <span>{u.name}</span>
                <span className="text-xs uppercase text-slate-400">{u.role}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-effect-light p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Gestión de Materias</h2>
            <button className="text-sm text-primary hover:underline" onClick={() => navigateTo('gestion-materias')}>
              Administrar
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {subjects.slice(0, 5).map((subject) => (
              <li key={subject.id} className="flex items-center justify-between">
                <span>{subject.title}</span>
                <span className="text-xs text-slate-400">{subject.level || 'General'}</span>
              </li>
            ))}
          </ul>
          {calculusSubjects.length > 0 && (
            <button
              className="mt-4 w-full py-2.5 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
              onClick={() => setShowExamModal(true)}
            >
              Generar simulador de Cálculo
            </button>
          )}
        </div>
        <div className="glass-effect-light p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Gestión de Recursos</h2>
            <button className="text-sm text-primary hover:underline" onClick={() => navigateTo('gestion-recursos')}>
              Administrar
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {resources.slice(0, 5).map((resource) => (
              <li key={resource.id} className="flex items-center justify-between">
                <span className="truncate max-w-[150px]">{resource.title || resource.titulo}</span>
                <span className="text-xs text-slate-400 uppercase">{resource.type || resource.tipo}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ExamGeneratorModal
        open={showExamModal}
        onClose={() => setShowExamModal(false)}
        subjects={calculusSubjects}
        onGenerate={handleGenerateExam}
        loading={loadingExam}
      />
    </div>
  );
};

export default PanelAdmin;
