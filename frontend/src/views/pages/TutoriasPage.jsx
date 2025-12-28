import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { apiService } from '../../lib/api.js';

const TutoriasPage = ({ userRole, tutors, view = 'list', onDeleteUpcomingActivity }) => {
  const { pushToast } = useAppContext();
  const [loading, setLoading] = useState(false);

  // Profile State
  const [tutorProfile, setTutorProfile] = useState({
    specialties: '',
    tariff30: '',
    tariff60: '',
    bio: '',
    active: false
  });

  // Scheduling State
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTutor, setScheduleTutor] = useState(null);
  const [scheduleDuration, setScheduleDuration] = useState('30');
  const [scheduleTopic, setScheduleTopic] = useState('');

  // Requests State
  const [tutoringRequests, setTutoringRequests] = useState([]);

  const tutorsList = useMemo(() => (Array.isArray(tutors) ? tutors : []), [tutors]);

  useEffect(() => {
    // Only load profile if needed (for creators)
    if (userRole === 'creador' && (view === 'profile' || view === 'list')) {
      setLoading(true);
      apiService
        .getMyTutorProfile()
        .then((profile) => {
          if (profile) {
            setTutorProfile({
              specialties: profile.specialties || '',
              bio: profile.bio || '',
              active: profile.active || false,
              tariff30: profile.tariff30 || '',
              tariff60: profile.tariff60 || ''
            });
          }
        })
        .catch((error) => {
          console.error(error);
          pushToast({ title: 'Tutorías', message: error?.message || 'No se pudo cargar tu perfil de tutor.', type: 'alert' });
        })
        .finally(() => setLoading(false));
    }

    // Load tutoring requests function
    const loadRequests = () => {
      apiService
        .getDashboard()
        .then((data) => {
          if (data.tutoring && Array.isArray(data.tutoring)) {
            setTutoringRequests(data.tutoring);
          }
        })
        .catch((error) => {
          console.error('Error loading tutoring requests:', error);
        });
    };

    // Load requests if view requires it or just universally for creators
    if (userRole === 'creador') {
      loadRequests();
    }

    // Listen for real-time updates
    const handleDataChange = (e) => {
      if (e.detail?.type === 'tutoring' || e.detail?.type === 'notifications') {
        loadRequests();
      }
    };

    window.addEventListener('data-change', handleDataChange);
    return () => window.removeEventListener('data-change', handleDataChange);
  }, [userRole, view, pushToast]);

  const saveTutorProfile = async () => {
    setLoading(true);
    try {
      await apiService.updateMyTutorProfile({
        specialties: tutorProfile.specialties,
        bio: tutorProfile.bio,
        active: tutorProfile.active,
        tariff30: tutorProfile.tariff30 === '' ? null : Number(tutorProfile.tariff30),
        tariff60: tutorProfile.tariff60 === '' ? null : Number(tutorProfile.tariff60)
      });
      pushToast({ title: 'Tutorías', message: 'Perfil actualizado.', type: 'success' });
    } catch (error) {
      pushToast({ title: 'Tutorías', message: error?.message || 'No se pudo actualizar.', type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (sessionId, newStatus) => {
    try {
      // Manually update local storage to simulate backend status update
      const sessions = JSON.parse(localStorage.getItem('estudia-pro-demo-tutoring-sessions') || '[]');
      const updatedSessions = sessions.map(s => s.id === sessionId ? { ...s, status: newStatus } : s);
      localStorage.setItem('estudia-pro-demo-tutoring-sessions', JSON.stringify(updatedSessions));

      // Update local state immediately
      setTutoringRequests(prev => prev.map(r => r.id === sessionId ? { ...r, status: newStatus } : r));

      pushToast({
        title: 'Tutorías',
        message: `Solicitud ${newStatus === 'CONFIRMADA' ? 'confirmada' : 'rechazada'}.`,
        type: newStatus === 'CONFIRMADA' ? 'success' : 'info'
      });

      apiService.broadcastChange('tutoring');
    } catch (error) {
      console.error('Error updating status:', error);
      pushToast({ title: 'Error', message: 'No se pudo actualizar el estado.', type: 'alert' });
    }
  };

  const openSchedule = (tutor) => {
    setScheduleTutor(tutor);
    setScheduleDuration('30');
    setScheduleTopic('');
    setScheduleOpen(true);
  };

  const submitSchedule = async (event) => {
    event.preventDefault();
    if (!scheduleTutor) return;
    setLoading(true);
    try {
      await apiService.scheduleTutoring(scheduleTutor.id, null, Number(scheduleDuration), scheduleTopic.trim());
      pushToast({ title: 'Tutorías', message: 'Solicitud enviada.', type: 'success' });
      setScheduleOpen(false);
    } catch (error) {
      pushToast({ title: 'Tutorías', message: error?.message || 'No se pudo agendar.', type: 'alert' });
    } finally {
      setLoading(false);
    }
  };

  // RENDER FOR CREATOR - SPLIT VIEWS
  if (userRole === 'creador') {
    return (
      <div className="page active space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {view === 'requests' ? 'Solicitudes de Tutoría' : 'Perfil de Tutor'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {view === 'requests'
              ? 'Gestiona las solicitudes de tus estudiantes.'
              : 'Configura la materia y tus tarifas como tutor.'}
          </p>
        </div>

        {/* REQUESTS VIEW */}
        {view === 'requests' && (
          <div className="glass-effect-light p-6 rounded-2xl space-y-4">
            {tutoringRequests.length > 0 ? (
              <div className="space-y-3">
                {tutoringRequests.map((request) => (
                  <div key={request.id} className="p-4 bg-white/50 dark:bg-slate-800/30 border border-slate-200 dark:border-white/10 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="font-semibold text-lg">{request.student}</p>
                      <div className="text-xs text-slate-500 flex flex-col gap-1">
                        <span>@{request.studentUsername}</span>
                        <span>{request.studentEmail}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">
                        <span className="font-medium">Tema:</span> {request.subject}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>📅 {request.date}</span>
                        <span>⏱ {request.duration}</span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 self-end md:self-auto min-w-[140px]">
                      <span className={`text-xs px-3 py-1 rounded-full mb-1 text-center w-full ${request.status === 'PROGRAMADA'
                        ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-200'
                        : request.status === 'CONFIRMADA'
                          ? 'bg-green-500/10 text-green-600 border border-green-200'
                          : 'bg-red-500/10 text-red-600 border border-red-200'
                        }`}>
                        {request.status}
                      </span>

                      <div className="flex gap-2 w-full">
                        {request.status !== 'CONFIRMADA' && (
                          <button
                            onClick={() => handleUpdateStatus(request.id, 'CONFIRMADA')}
                            className="flex-1 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
                          >
                            Aceptar
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteUpcomingActivity ? onDeleteUpcomingActivity(`tut-${request.id}`) : handleUpdateStatus(request.id, 'RECHAZADA')}
                          className={`flex-1 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors shadow-sm ${request.status === 'CONFIRMADA'
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                          {request.status === 'CONFIRMADA' ? 'Cancelar' : 'Rechazar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="mb-2 text-4xl"></p>
                <p>No tienes solicitudes de tutoría pendientes.</p>
              </div>
            )}
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && (
          <div className="glass-effect-light p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold">Configuración de Perfil</h2>

            <div className="space-y-1">
              <label className="text-xs text-slate-500">Materia(s) que ofreces</label>
              <input
                type="text"
                value={tutorProfile.specialties}
                onChange={(e) => setTutorProfile((prev) => ({ ...prev, specialties: e.target.value }))}
                placeholder="Ej. Cálculo, Álgebra"
                className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Tarifa 30 min (MXN)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={tutorProfile.tariff30}
                  onChange={(e) => setTutorProfile((prev) => ({ ...prev, tariff30: e.target.value }))}
                  className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Tarifa 60 min (MXN)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={tutorProfile.tariff60}
                  onChange={(e) => setTutorProfile((prev) => ({ ...prev, tariff60: e.target.value }))}
                  className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-500">Bio (opcional)</label>
              <textarea
                rows={3}
                value={tutorProfile.bio}
                onChange={(e) => setTutorProfile((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="Describe cómo das asesorías, horarios, etc."
                className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={tutorProfile.active}
                onChange={(e) => setTutorProfile((prev) => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
              Mostrarme como tutor disponible
            </label>

            <button
              type="button"
              disabled={loading}
              className="py-2.5 px-6 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg w-fit disabled:opacity-60 transition-colors shadow-lg shadow-primary/20"
              onClick={saveTutorProfile}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // RENDER FOR STUDENTS (unchanged)
  return (
    <>
      <div className="page active space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tutorías Disponibles</h1>
          <p className="text-slate-500 dark:text-slate-400">Conecta con tutores expertos en cada materia.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorsList.length ? (
            tutorsList.map((tutor) => (
              <div key={tutor.id} className="glass-effect-light p-6 rounded-2xl flex flex-col gap-3 hover:shadow-lg transition-all duration-300 border border-transparent hover:border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {(tutor.name || 'Tutor').split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{tutor.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1">{tutor.specialties}</p>
                    {Number.isFinite(Number(tutor.rating)) ? (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{Number(tutor.rating).toFixed(1)}</span>
                        {Number.isFinite(Number(tutor.sessions)) ? <span className="opacity-60">• {Number(tutor.sessions)} sesiones</span> : null}
                      </p>
                    ) : null}
                  </div>
                </div>
                {tutor.bio ? <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[40px]">{tutor.bio}</p> : null}
                <div className="mt-auto">
                  <p className="text-sm mb-3 pt-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <span className="text-slate-400 font-medium text-xs">COSTO/HORA</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">${tutor.tariff60}</span>
                  </p>
                  <button
                    type="button"
                    className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-all shadow-lg shadow-primary/20"
                    onClick={() => openSchedule(tutor)}
                  >
                    Agendar Tutoría
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-3 text-center text-slate-500 py-12">No hay tutores disponibles por ahora.</p>
          )}
        </div>
      </div>

      {scheduleOpen && scheduleTutor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-fade-in-up">
            <button
              type="button"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              onClick={() => setScheduleOpen(false)}
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-4">Agendar con {scheduleTutor.name}</h3>

            <form onSubmit={submitSchedule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Duración</label>
                <select
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="30">30 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Tema (opcional)</label>
                <input
                  type="text"
                  value={scheduleTopic}
                  onChange={(e) => setScheduleTopic(e.target.value)}
                  placeholder="Ej. Integrales por partes"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl disabled:opacity-60 transition-all shadow-lg shadow-primary/20 mt-2"
              >
                {loading ? 'Enviando...' : 'Confirmar Solicitud'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TutoriasPage;
