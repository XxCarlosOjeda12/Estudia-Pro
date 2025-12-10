// --- TAILWIND CONFIGURATION ---
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'primary': '#8b5cf6',
                'primary-focus': '#7c3aed',
                'secondary': '#10b981',
                'accent': '#f59e0b',
                'dark-bg': '#0f172a',
                'dark-card': '#1e293b',
                'dark-border': '#334155',
                'light-bg': '#f1f5f9',
                'light-card': '#ffffff',
                'light-border': '#e2e8f0',
            }
        }
    }
};

// --- API CONFIGURATION ---
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api', // Cambiar según tu backend
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            VERIFY: '/auth/verify',
            LOGOUT: '/auth/logout'
        },
        USERS: {
            GET_PROFILE: '/users/profile',
            UPDATE_PROFILE: '/users/profile'
        },
        SUBJECTS: {
            GET_ALL: '/subjects',
            GET_USER_SUBJECTS: '/users/subjects',
            ADD_SUBJECT: '/users/subjects',
            UPDATE_EXAM_DATE: '/users/subjects/exam-date'
        },
        RESOURCES: {
            GET_ALL: '/resources',
            GET_PURCHASED: '/users/resources',
            PURCHASE: '/resources/purchase',
            DOWNLOAD: '/resources/download'
        },
        EXAMS: {
            GET_ALL: '/exams',
            START_EXAM: '/exams/start',
            SUBMIT_EXAM: '/exams/submit'
        },
        TUTORS: {
            GET_ALL: '/tutors',
            SCHEDULE: '/tutors/schedule'
        },
        FORUMS: {
            GET_ALL: '/forums',
            CREATE_TOPIC: '/forums/topics',
            GET_TOPIC: '/forums/topics'
        },
        ACHIEVEMENTS: {
            GET_USER_ACHIEVEMENTS: '/users/achievements',
            GET_ALL: '/achievements'
        },
        NOTIFICATIONS: {
            GET_USER_NOTIFICATIONS: '/users/notifications',
            MARK_READ: '/users/notifications/read'
        },
        ADMIN: {
            USERS: '/admin/users',
            SUBJECTS: '/admin/subjects',
            RESOURCES: '/admin/resources'
        },
        FORMULARIES: {
            GET_ALL: '/formularies'
        }
    }
};

// --- API SERVICE ---
// Modo demo para pruebas sin backend
const DEMO_MODE = true; // Cambiar a false para usar la API real
const DEMO_USER = {
    id: 'demo-1',
    name: 'Usuario Demo',
    email: 'demo@demo.com',
    role: 'estudiante'
};

const apiService = {
    // Helper para hacer peticiones
    async request(endpoint, method = 'GET', data = null, requiresAuth = true) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        // Si estamos en modo demo, simulamos respuestas en el cliente
        if (typeof DEMO_MODE !== 'undefined' && DEMO_MODE) {
            // Pequeña latencia simulada
            await new Promise(r => setTimeout(r, 250));

            // Autenticación
            if (endpoint === API_CONFIG.ENDPOINTS.AUTH.LOGIN && method === 'POST') {
                if (data && data.email === DEMO_USER.email && data.password === 'demo123') {
                    localStorage.setItem('authToken', 'demo-token');
                    return { success: true, token: 'demo-token', user: DEMO_USER };
                }
                return { success: false, message: 'Credenciales inválidas (usar demo@demo.com / demo123)' };
            }

            if (endpoint === API_CONFIG.ENDPOINTS.AUTH.REGISTER && method === 'POST') {
                return { success: true, message: 'Registro simulado (modo demo)' };
            }

            if (endpoint === API_CONFIG.ENDPOINTS.AUTH.LOGOUT) {
                localStorage.removeItem('authToken');
                return { success: true };
            }

            // Perfil de usuario
            if (endpoint === API_CONFIG.ENDPOINTS.USERS.GET_PROFILE) {
                const token = localStorage.getItem('authToken');
                if (token === 'demo-token') return DEMO_USER;
                throw new Error('No autorizado (modo demo)');
            }

            // Materias y recursos de ejemplo
            if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL) {
                return [
                    { id: 'm1', title: 'Álgebra Básica', description: 'Conceptos fundamentales' },
                    { id: 'm2', title: 'Cálculo I', description: 'Límites y derivadas' }
                ];
            }

            if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.GET_USER_SUBJECTS) {
                return [
                    {
                        id: 'm1',
                        title: 'Álgebra Básica',
                        professor: 'Prof. García',
                        school: 'ESCOM',
                        progress: 45,
                        examDate: '2025-10-15',
                        temario: [
                            { title: 'Números Reales' },
                            { title: 'Ecuaciones Lineales' },
                            { title: 'Polinomios' },
                            { title: 'Inecuaciones' }
                        ]
                    },
                    {
                        id: 'm2',
                        title: 'Álgebra Lineal',
                        professor: 'Dra. Sofía Reyes',
                        school: 'ESCOM',
                        progress: 60,
                        examDate: '2025-09-24',
                        temario: [
                            { title: 'Matrices y Determinantes' },
                            { title: 'Sistemas de Ecuaciones' },
                            { title: 'Espacios Vectoriales' },
                            { title: 'Transformaciones Lineales' }
                        ]
                    },
                    {
                        id: 'm3',
                        title: 'Cálculo Diferencial',
                        professor: 'Dr. Armando Flores',
                        school: 'ESCOM',
                        progress: 25,
                        examDate: '2025-11-05',
                        temario: [
                            { title: 'Límites' },
                            { title: 'Derivadas' },
                            { title: 'Aplicaciones de la Derivada' }
                        ]
                    }
                ];
            }

            // Formularios Mock Data
            if (endpoint === API_CONFIG.ENDPOINTS.FORMULARIES?.GET_ALL) {
                return [
                    { id: 'f1', title: 'Fórmulas de Derivadas', subject: 'Cálculo', type: 'PDF', url: '#' },
                    { id: 'f2', title: 'Identidades Trigonométricas', subject: 'Trigonometría', type: 'PDF', url: '#' },
                    { id: 'f3', title: 'Tabla de Integrales', subject: 'Cálculo Integral', type: 'PDF', url: '#' },
                    { id: 'f4', title: 'Propiedades de Logaritmos', subject: 'Álgebra', type: 'PDF', url: '#' }
                ];
            }

            // Logros Mock Data
            if (endpoint === API_CONFIG.ENDPOINTS.ACHIEVEMENTS?.GET_ALL) {
                return [
                    { id: 'l1', title: 'Primeros Pasos', description: 'Iniciaste sesión por primera vez', icon: '🚀', date: '2024-01-15' },
                    { id: 'l2', title: 'Estudioso', description: 'Completaste 5 horas de estudio', icon: '📚', date: '2024-02-10' },
                    { id: 'l3', title: 'Imparable', description: 'Racha de 7 días seguidos', icon: '🔥', date: '2024-03-01' },
                    { id: 'l4', title: 'Nivel 1 Completado', description: 'Aprobaste tu primer examen simulacro', icon: '⭐', date: '2024-03-05' }
                ];
            }

            if (endpoint === API_CONFIG.ENDPOINTS.RESOURCES.GET_ALL) return [];
            if (endpoint === API_CONFIG.ENDPOINTS.EXAMS.GET_ALL) return [];
            if (endpoint === API_CONFIG.ENDPOINTS.TUTORS.GET_ALL) return [];
            if (endpoint === API_CONFIG.ENDPOINTS.FORUMS.GET_ALL) return [];

            // Manejo de endpoints con parámetros (ej. /forums/topics/:id)
            if (endpoint.startsWith(API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC)) {
                return { id: 'topic-demo', title: 'Tema demo', posts: [] };
            }

            // Valor por defecto
            return {};
        }

        if (requiresAuth) {
            const token = localStorage.getItem('authToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        const options = {
            method,
            headers,
            credentials: 'include' // Para cookies si las usas
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    // Autenticación
    async login(email, password) {
        return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, 'POST', { email, password }, false);
    },

    async register(userData) {
        return this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, 'POST', userData, false);
    },

    async verify(email, code) {
        return this.request(API_CONFIG.ENDPOINTS.AUTH.VERIFY, 'POST', { email, code }, false);
    },

    async logout() {
        return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, 'POST');
    },

    // Usuarios
    async getProfile() {
        return this.request(API_CONFIG.ENDPOINTS.USERS.GET_PROFILE);
    },

    async updateProfile(profileData) {
        return this.request(API_CONFIG.ENDPOINTS.USERS.UPDATE_PROFILE, 'PUT', profileData);
    },

    // Materias
    async getAllSubjects() {
        return this.request(API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL);
    },

    async getUserSubjects() {
        return this.request(API_CONFIG.ENDPOINTS.SUBJECTS.GET_USER_SUBJECTS);
    },

    async addSubject(subjectId) {
        return this.request(API_CONFIG.ENDPOINTS.SUBJECTS.ADD_SUBJECT, 'POST', { subjectId });
    },

    async updateExamDate(subjectId, examDate) {
        return this.request(API_CONFIG.ENDPOINTS.SUBJECTS.UPDATE_EXAM_DATE, 'PUT', { subjectId, examDate });
    },

    // Recursos
    async getAllResources() {
        return this.request(API_CONFIG.ENDPOINTS.RESOURCES.GET_ALL);
    },

    async getAllFormularies() {
        return this.request(API_CONFIG.ENDPOINTS.FORMULARIES.GET_ALL);
    },

    async getAllAchievements() {
        return this.request(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_ALL);
    },

    async getPurchasedResources() {
        return this.request(API_CONFIG.ENDPOINTS.RESOURCES.GET_PURCHASED);
    },

    async purchaseResource(resourceId) {
        return this.request(API_CONFIG.ENDPOINTS.RESOURCES.PURCHASE, 'POST', { resourceId });
    },

    async downloadResource(resourceId) {
        return this.request(API_CONFIG.ENDPOINTS.RESOURCES.DOWNLOAD, 'POST', { resourceId });
    },

    // Exámenes
    async getAllExams() {
        return this.request(API_CONFIG.ENDPOINTS.EXAMS.GET_ALL);
    },

    async startExam(examId) {
        return this.request(API_CONFIG.ENDPOINTS.EXAMS.START_EXAM, 'POST', { examId });
    },

    async submitExam(examId, answers) {
        return this.request(API_CONFIG.ENDPOINTS.EXAMS.SUBMIT_EXAM, 'POST', { examId, answers });
    },

    // Tutores
    async getAllTutors() {
        return this.request(API_CONFIG.ENDPOINTS.TUTORS.GET_ALL);
    },

    async scheduleTutoring(tutorId, subjectId, duration, topic) {
        return this.request(API_CONFIG.ENDPOINTS.TUTORS.SCHEDULE, 'POST', { tutorId, subjectId, duration, topic });
    },

    // Foros
    async getAllForums() {
        return this.request(API_CONFIG.ENDPOINTS.FORUMS.GET_ALL);
    },

    async createForumTopic(topicData) {
        return this.request(API_CONFIG.ENDPOINTS.FORUMS.CREATE_TOPIC, 'POST', topicData);
    },

    async getForumTopic(topicId) {
        return this.request(`${API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC}/${topicId}`);
    },

    // Logros
    async getUserAchievements() {
        return this.request(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_USER_ACHIEVEMENTS);
    },

    // Notificaciones
    async getUserNotifications() {
        return this.request(API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_USER_NOTIFICATIONS);
    },

    async markNotificationAsRead(notificationId) {
        return this.request(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ, 'POST', { notificationId });
    },

    // Administración
    async getAllUsers() {
        return this.request(API_CONFIG.ENDPOINTS.ADMIN.USERS);
    },

    async manageUser(userId, action, data) {
        return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}`, 'PUT', { action, ...data });
    },

    async createSubject(subjectData) {
        return this.request(API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS, 'POST', subjectData);
    },

    async updateSubject(subjectId, subjectData) {
        return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS}/${subjectId}`, 'PUT', subjectData);
    },

    async deleteSubject(subjectId) {
        return this.request(`${API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS}/${subjectId}`, 'DELETE');
    }
};

// --- GLOBAL UTILS & STATE ---
const Global = {
    state: {
        currentUser: null,
        theme: localStorage.getItem('theme') || 'dark',
    },

    // Theme Management
    toggleTheme() {
        this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.state.theme);
        this.applyTheme();
    },

    applyTheme() {
        if (this.state.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    // Shared UI Helpers
    showNotification(title, message) {
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'fixed top-4 right-4 z-50 w-80 space-y-3 pointer-events-none';
            document.body.appendChild(container); // Append to body if not found
        }

        const notif = document.createElement('div');
        notif.className = 'glass-effect-light p-4 rounded-xl mb-3 animate-modal-in border-l-4 border-primary bg-white dark:bg-dark-card shadow-lg';
        notif.innerHTML = `
            <div class="flex justify-between items-start">
                <h4 class="font-bold text-sm">${title}</h4>
                <button class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">${message}</p>
        `;

        container.appendChild(notif);
        setTimeout(() => {
            if (notif.parentNode) notif.remove();
        }, 5000);
    },

    showLoading(show) {
        // Simple global loader implementation if needed, or specific per view
        // Using a global spinner overlay for simplicity in this refactor
        const loaderId = 'global-loader';
        let loader = document.getElementById(loaderId);

        if (show) {
            if (!loader) {
                loader = document.createElement('div');
                loader.id = loaderId;
                loader.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center';
                loader.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>';
                document.body.appendChild(loader);
            }
            loader.classList.remove('hidden');
        } else {
            if (loader) loader.classList.add('hidden');
        }
    },

    // Initial Setup for all pages
    init() {
        this.applyTheme();

        // Setup theme toggles globally
        const themeToggles = document.querySelectorAll('[id$="theme-toggle"]');
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleTheme());
        });

        // Setup password visibility globally
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Find input associated with this button (sibling or parent wrapper)
                // Assuming wrapper struct: relative -> input + button
                const wrapper = e.currentTarget.closest('.relative');
                if (wrapper) {
                    const input = wrapper.querySelector('input');
                    if (input) {
                        if (input.type === 'password') {
                            input.type = 'text';
                            e.currentTarget.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>';
                        } else {
                            input.type = 'password';
                            e.currentTarget.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>';
                        }
                    }
                }
            });
        });
    }
};

// Initialize Global when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Global.init();
});