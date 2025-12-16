import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { apiService } from '../../lib/api.js';

const TutoriasPage = ({ userRole, tutors }) => {
  const { pushToast } = useAppContext();
  const [loading, setLoading] = useState(false);

  const [tutorProfile, setTutorProfile] = useState({
    specialties: '',
    tariff30: '',
    tariff60: '',
    bio: '',
    active: false
  });

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleTutor, setScheduleTutor] = useState(null);
  const [scheduleDuration, setScheduleDuration] = useState('30');
  const [scheduleTopic, setScheduleTopic] = useState('');

  const tutorsList = useMemo(() => (Array.isArray(tutors) ? tutors : []), [tutors]);

  useEffect(() => {
    if (userRole !== 'creador') return;
    setLoading(true);
    apiService
      .getMyTutorProfile()
      .then((profile) => setTutorProfile(profile))
      .catch((error) => {
        console.error(error);
        pushToast({ title: 'Tutorías', message: error?.message || 'No se pudo cargar tu perfil de tutor.', type: 'alert' });
      })
      .finally(() => setLoading(false));
  }, [userRole, pushToast]);

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

  if (userRole === 'creador') {
    return (
      <div className="page active space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mis Tutorías</h1>
          <p className="text-slate-500 dark:text-slate-400">Configura la materia y tus tarifas como tutor.</p>
        </div>
        <div className="glass-effect-light p-6 rounded-2xl space-y-4">
          <h2 className="text-xl font-bold">Perfil de Tutor</h2>

          <div className="space-y-1">
            <label className="text-xs text-slate-500">Materia(s) que ofreces</label>
            <input
              type="text"
              value={tutorProfile.specialties}
              onChange={(e) => setTutorProfile((prev) => ({ ...prev, specialties: e.target.value }))}
              placeholder="Ej. Cálculo, Álgebra"
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
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
                className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl w-full"
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
                className="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl w-full"
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
              className="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={tutorProfile.active}
              onChange={(e) => setTutorProfile((prev) => ({ ...prev, active: e.target.checked }))}
            />
            Mostrarme como tutor disponible
          </label>

          <button
            type="button"
            disabled={loading}
            className="py-2 px-4 bg-primary text-white rounded-md w-fit disabled:opacity-60"
            onClick={saveTutorProfile}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tutorías Disponibles</h1>
        <p className="text-slate-500 dark:text-slate-400">Conecta con tutores expertos en cada materia.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tutorsList.length ? (
          tutorsList.map((tutor) => (
            <div key={tutor.id} className="glass-effect-light p-6 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                  {(tutor.name || 'Tutor').split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{tutor.name}</h3>
                  <p className="text-sm text-slate-500">{tutor.specialties}</p>
                  {Number.isFinite(Number(tutor.rating)) ? (
                    <p className="text-xs text-slate-500">
                      {'★'.repeat(Math.max(0, Math.min(5, Math.round(Number(tutor.rating)))))}
                      <span className="ml-2">({Number(tutor.rating).toFixed(1)})</span>
                      {Number.isFinite(Number(tutor.sessions)) ? <span className="ml-2">• {Number(tutor.sessions)} sesiones</span> : null}
                    </p>
                  ) : null}
                </div>
              </div>
              {tutor.bio ? <p className="text-sm text-slate-500 dark:text-slate-400">{tutor.bio}</p> : null}
              <p className="text-sm">
                <strong>Tarifas:</strong> ${tutor.tariff30} (30min) / ${tutor.tariff60} (60min)
              </p>
              <button
                type="button"
                className="w-full py-2 bg-primary/80 hover:bg-primary text-white rounded-md"
                onClick={() => openSchedule(tutor)}
              >
                Agendar Tutoría
              </button>
            </div>
          ))
        ) : (
          <p className="col-span-3 text-center text-slate-500">No hay tutores disponibles por ahora.</p>
        )}
      </div>

      {scheduleOpen && scheduleTutor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-slate-900 border border-white/10 text-slate-100 rounded-2xl w-full max-w-lg p-6 relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              onClick={() => setScheduleOpen(false)}
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-4">Agendar con {scheduleTutor.name}</h3>

            <form onSubmit={submitSchedule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Duración</label>
                <select
                  value={scheduleDuration}
                  onChange={(e) => setScheduleDuration(e.target.value)}
                  className="w-full p-3 bg-slate-800/60 border border-white/10 rounded-xl"
                >
                  <option value="30">30 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Tema (opcional)</label>
                <input
                  type="text"
                  value={scheduleTopic}
                  onChange={(e) => setScheduleTopic(e.target.value)}
                  placeholder="Ej. Integrales por partes"
                  className="w-full p-3 bg-slate-800/60 border border-white/10 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-primary text-white rounded-lg disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutoriasPage;
