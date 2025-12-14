import { useState } from 'react';
import { apiService } from '../lib/api';
import { useAppContext } from '../context/AppContext';

const RegisterPage = ({ onNavigate }) => {
    const { pushToast } = useAppContext();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'ESTUDIANTE'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation
        if (!formData.name || !formData.username || !formData.email || !formData.password) {
            setError('Todos los campos son obligatorios');
            setLoading(false);
            return;
        }

        try {
            // Transform data to match Backend Serializer requirements
            const nameParts = formData.name.trim().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Usuario';

            const payload = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                password_confirm: formData.password, // Backend requires this field
                first_name: firstName,
                last_name: lastName,
                rol: formData.role,
                // Default values to satisfy backend validation without extra UI steps
                nivel_escolar: 'Universidad',
                especialidad: 'General',
                id_institucion: 1
            };

            const response = await apiService.register(payload);

            if (response && response.success) {
                // Achievement Unlocked: Account Created
                pushToast({
                    title: 'Cuenta Creada',
                    message: 'Tu perfil ha sido registrado correctamente.',
                    type: 'success'
                });
                // Redirect to login after slight delay for effect
                setTimeout(() => {
                    onNavigate('login');
                }, 1500);
            } else {
                console.error("Registration Error Response:", response);
                let msg = response?.message || 'Error al registrar usuario';
                // Try to extract specific validation error
                if (response && typeof response === 'object' && !response.success && !response.message) {
                    const values = Object.values(response).flat();
                    if (values.length > 0) msg = values[0];
                }
                setError(msg);
                pushToast({
                    title: 'Error de Registro',
                    message: msg,
                    type: 'alert'
                });
            }
        } catch (err) {
            console.error("Registration Exception:", err);
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-dark-bg text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        Crear Cuenta
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">Únete a la plataforma educativa</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200 text-sm">
                        <span>⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Nombre Completo</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Usuario</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="Ej. juaperez23"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Correo Electrónico</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5 ml-1">¿Qué quieres ser?</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, role: 'ESTUDIANTE' }))}
                                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.role === 'ESTUDIANTE'
                                    ? 'bg-primary/20 border-primary text-white shadow-lg shadow-primary/10'
                                    : 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800/50'
                                    }`}
                            >
                                <span className="text-2xl">🎓</span>
                                <span className="text-sm font-medium">Estudiante</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, role: 'CREADOR' }))}
                                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 ${formData.role === 'CREADOR'
                                    ? 'bg-secondary/20 border-secondary text-white shadow-lg shadow-secondary/10'
                                    : 'bg-slate-800/30 border-white/5 text-slate-400 hover:bg-slate-800/50'
                                    }`}
                            >
                                <span className="text-2xl">⚡</span>
                                <span className="text-sm font-medium">Creador</span>
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {loading ? 'Registrando...' : 'Completar Registro'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">
                        ¿Ya tienes cuenta?{' '}
                        <button
                            onClick={() => onNavigate('login')}
                            className="text-primary hover:text-primary-focus font-medium transition-colors"
                        >
                            Inicia Sesión
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
