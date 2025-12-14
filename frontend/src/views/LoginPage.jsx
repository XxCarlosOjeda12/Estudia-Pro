import { useEffect, useState } from 'react';
import { DEMO_PROFILES } from '../lib/constants.js';
import { apiService } from '../lib/api.js';
import { useAppContext } from '../context/AppContext.jsx';

const LoginPage = ({ onNavigate }) => {
  const { login, loading, demoEnabled, toggleDemoMode, pushToast } = useAppContext();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('savedIdentifier');
    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-[#0b1224] to-[#0c1530] text-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
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
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">Accesos Rápidos (Demo)</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.keys(DEMO_PROFILES).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDemoProfile(key)}
                  className="px-2 py-2 rounded-lg border border-slate-700 hover:border-primary hover:text-primary transition-colors bg-slate-800/50"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
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
                placeholder="tu.usuario o correo"
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-slate-100 placeholder-slate-500 transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-slate-100 placeholder-slate-500 transition-all"
              />
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
              <button type="button" className="text-primary text-sm hover:text-primary-focus transition-colors">
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
    </div>
  );
};

export default LoginPage;
