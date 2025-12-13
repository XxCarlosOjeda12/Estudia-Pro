import { useEffect, useState } from 'react';
import { DEMO_PROFILES } from '../lib/constants.js';
import { apiService } from '../lib/api.js';
import { useAppContext } from '../context/AppContext.jsx';

const LoginPage = () => {
  const { login, loading, demoEnabled, toggleDemoMode, pushToast } = useAppContext();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [mode, setMode] = useState('login');
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ESTUDIANTE'
  });

  useEffect(() => {
    const saved = localStorage.getItem('savedIdentifier');
    if (saved) {
      setIdentifier(saved);
      setRemember(true);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (mode === 'login') {
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
      return;
    }

    if (!registerData.email || !registerData.password || !registerData.name) {
      pushToast({ title: 'Campos requeridos', message: 'Completa nombre, correo y contraseña.', type: 'alert' });
      return;
    }
    const payload = {
      email: registerData.email,
      password: registerData.password,
      username: registerData.email.split('@')[0],
      name: registerData.name,
      rol: registerData.role
    };
    const response = await apiService.register(payload);
    if (response?.success) {
      pushToast({ title: 'Registro', message: response?.message || 'Registro exitoso, ahora inicia sesión.', type: 'success' });
      setMode('login');
      setIdentifier(registerData.email);
      setPassword(registerData.password);
    } else {
      pushToast({ title: 'Registro', message: response?.message || 'No se pudo completar el registro.', type: 'alert' });
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
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-[#0b1224] to-[#0c1530] text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary">Estudia-Pro</h1>
          <p className="text-slate-400 mt-2">Tu aliado para aprobar y avanzar en matemáticas.</p>
        </div>

        <div className="glass-effect-light p-8 rounded-2xl shadow-2xl border border-white/10">
          <div className="flex border-b border-slate-700/40 mb-4">
            <button
              className={`flex-1 py-2 font-medium text-center ${mode === 'login' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
              onClick={() => setMode('login')}
            >
              Iniciar Sesión
            </button>
            <button
              className={`flex-1 py-2 font-medium text-center ${mode === 'register' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}
              onClick={() => setMode('register')}
            >
              Registrarse
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Modo Demo listo para pruebas</span>
            <button
              type="button"
              onClick={toggleDemoMode}
              className={`px-3 py-1 rounded-full border text-[11px] font-semibold uppercase tracking-widest ${demoEnabled ? 'border-primary/40 text-primary' : 'border-slate-400 text-slate-400'}`}
            >
              {demoEnabled ? 'Activado' : 'Desactivado'}
            </button>
          </div>

          <div className="text-[11px] mb-6 bg-slate-900/50 border border-white/5 rounded-lg px-3 py-2 text-slate-400">
            También puedes usar tus credenciales reales. Para la demo utiliza <span className="font-semibold text-primary">demo@estudiapro.com / demo123</span>.
          </div>

          <div className={`${demoEnabled && mode === 'login' ? 'block' : 'hidden'} mb-6`}>
            <p className="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Perfiles rápidos</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {Object.keys(DEMO_PROFILES).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDemoProfile(key)}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary transition-colors"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'login' ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-1">
                    Usuario o correo electrónico
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="tu.usuario o correo"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-1">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-100"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-400">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    Recordarme
                  </label>
                  <button type="button" className="text-primary text-sm hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Nombre completo</label>
                  <input
                    type="text"
                    value={registerData.name}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, name: event.target.value }))}
                    placeholder="Tu nombre"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Correo</label>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, email: event.target.value }))}
                    placeholder="correo@estudiapro.com"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Contraseña</label>
                  <input
                    type="password"
                    value={registerData.password}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Rol</label>
                  <select
                    value={registerData.role}
                    onChange={(event) => setRegisterData((prev) => ({ ...prev, role: event.target.value }))}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-slate-100"
                  >
                    <option value="ESTUDIANTE">Estudiante</option>
                    <option value="CREADOR">Creador</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105 disabled:opacity-60"
            >
              {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button type="button" className="text-primary font-bold hover:underline" onClick={() => setMode('register')}>
                  Regístrate gratis
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button type="button" className="text-primary font-bold hover:underline" onClick={() => setMode('login')}>
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
