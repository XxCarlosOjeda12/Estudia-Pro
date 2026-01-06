import { useEffect, useState } from 'react';
import { DEMO_PROFILES } from '../lib/constants.js';
import { apiService } from '../lib/api.js';
import { useAppContext } from '../context/AppContext.jsx';

const LoginPage = ({ onNavigate }) => {
  const { login, loading, demoEnabled, toggleDemoMode, pushToast } = useAppContext();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savedIdentifier');
    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }
  }, []);

  const closeResetModal = () => {
    setResetOpen(false);
    setResetLoading(false);
    setResetPassword('');
    setResetPasswordConfirm('');
  };

  const handleForgotPassword = async () => {
    if (!demoEnabled) {
      pushToast({
        title: 'Recuperación de contraseña',
        message: 'En modo real no se puede ver tu contraseña (se guarda cifrada). Pide un reset o crea una nueva cuenta.',
        type: 'info'
      });
      return;
    }

    const target = (identifier || '').trim();
    setResetIdentifier(target);
    setResetOpen(true);
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();
    if (!demoEnabled) return;

    const target = (resetIdentifier || '').trim();
    if (!target) {
      pushToast({ title: 'Modo demo', message: 'Escribe tu usuario o correo.', type: 'alert' });
      return;
    }
    if (!resetPassword) {
      pushToast({ title: 'Modo demo', message: 'Escribe una nueva contraseña.', type: 'alert' });
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      pushToast({ title: 'Modo demo', message: 'Las contraseñas no coinciden.', type: 'alert' });
      return;
    }

    setResetLoading(true);
    const result = await apiService.resetDemoPassword(target, resetPassword);
    setResetLoading(false);

    pushToast({
      title: 'Modo demo',
      message: result?.message || (result?.success ? 'Contraseña actualizada.' : 'No se pudo actualizar la contraseña.'),
      type: result?.success ? 'success' : 'alert'
    });

    if (result?.success) {
      setIdentifier(target);
      setPassword(resetPassword);
      closeResetModal();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identifier || !password) {
      pushToast({ title: 'Campos requeridos', message: 'Escribe tu usuario y contraseña.', type: 'alert' });
      return;
    }
    const response = await login(identifier, password, remember);
    if (!response?.success) {
      pushToast({ title: 'Inicio de sesión', message: response?.message || 'No pudimos iniciar sesión.', type: 'alert' });
    } else {
      pushToast({ title: 'Bienvenido', message: 'Redirigiendo a tu panel principal.', type: 'success' });
    }
  };

  const handleDemoProfile = (profileKey) => {
    if (!demoEnabled) {
      pushToast({ title: 'Modo demo desactivado', message: 'Activa el modo demo para usar perfiles rápidos.' });
      return;
    }
    const profile = DEMO_PROFILES[profileKey];
    if (profile) {
      setIdentifier(profile.email || profile.username);
      setPassword(profile.password || 'demo123');
    }
  };

  return (
    <div className="dark min-h-screen bg-gradient-to-br from-dark-bg via-[#0b1224] to-[#0c1530] text-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">Estudia-Pro</h1>
          <p className="text-slate-400 mt-2">Tu aliado para aprobar y avanzar en matemáticas.</p>
        </div>

        <div className="glass-effect-light p-8 rounded-2xl shadow-2xl border border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-6">
            <span>Inicio de Sesión</span>
            <button
              type="button"
              onClick={toggleDemoMode}
              className={`px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest transition-all ${demoEnabled ? 'border-primary/40 text-primary bg-primary/5' : 'border-slate-600 text-slate-500 hover:text-slate-300'}`}
            >
              {demoEnabled ? 'Demo Mode On' : 'Real Mode'}
            </button>
          </div>

          <div className={`${demoEnabled ? 'block' : 'hidden'} mb-6`}>
            {/* Botón de usuario estilo Sidebar */}
            <button
              type="button"
              onClick={() => setShowQuickAccess(!showQuickAccess)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-white tracking-wide">Accesos Rápidos</p>
                  <p className="text-[10px] text-primary-light uppercase tracking-widest font-bold opacity-80"></p>
                </div>
              </div>
              <div className={`transition-transform duration-300 ${showQuickAccess ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-primary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </button>

            {/* Cuadrícula de perfiles estilo Sidebar */}
            {showQuickAccess && (
              <div className="mt-4 grid grid-cols-2 gap-2.5 animate-in fade-in slide-in-from-top-4 duration-500">
                {Object.keys(DEMO_PROFILES).map((key) => {
                  const profile = DEMO_PROFILES[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDemoProfile(key)}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-white/5 hover:bg-primary/10 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all group text-left h-full"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center text-xs font-bold text-slate-300 group-hover:bg-primary/20 group-hover:text-primary transition-all shrink-0">
                        {profile.name?.charAt(0) || key.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-200 group-hover:text-white truncate capitalize leading-tight">{key}</p>
                        <p className="text-[9px] text-slate-500 group-hover:text-primary/70 truncate uppercase font-semibold tracking-tighter">{profile.rol}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                Usuario o correo
              </label>
              <input
                id="email"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Tu usuario o correo"
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-slate-100 placeholder-slate-500 transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-slate-100 placeholder-slate-500 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 text-primary bg-slate-800 border-slate-600 rounded focus:ring-primary"
                />
                Recordarme
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-primary text-sm hover:text-primary-focus transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-primary/25 transform hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? 'Iniciando sesión...' : 'Ingresar al Portal'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-8 border-t border-white/5 pt-6">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              className="text-primary font-bold hover:text-primary-focus transition-colors ml-1"
              onClick={() => onNavigate('register')}
            >
              Regístrate gratis
            </button>
          </p>
        </div>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="absolute inset-0" onClick={closeResetModal} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-fade-in-up">
            <button
              type="button"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              onClick={closeResetModal}
              aria-label="Cerrar"
            >
              ✕
            </button>

            <div className="mb-5">
              <h3 className="text-xl font-bold">Restablecer contraseña</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Disponible solo en modo demo. Actualiza la contraseña de una cuenta creada en demo.
              </p>
            </div>

            <form onSubmit={submitResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Usuario o correo</label>
                <input
                  type="text"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="Ej. estudiante2 o correo@ejemplo.com"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Nueva contraseña</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">Confirmar contraseña</label>
                <input
                  type="password"
                  value={resetPasswordConfirm}
                  onChange={(e) => setResetPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl disabled:opacity-60 transition-all shadow-lg shadow-primary/20"
              >
                {resetLoading ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>

              <button
                type="button"
                onClick={closeResetModal}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition-all"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
