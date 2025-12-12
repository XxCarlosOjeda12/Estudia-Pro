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

// --- GLOBAL CONFIGURATION & HELPERS ---
const DEMO_STORAGE_KEY = 'estudia-pro-demo-mode';
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api';
const DEMO_LATENCY = 350; // ms

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const DemoModeController = (() => {
    let enabled = true;

    try {
        const stored = localStorage.getItem(DEMO_STORAGE_KEY);
        if (stored !== null) {
            enabled = stored === 'true';
        }
    } catch (error) {
        console.warn('No se pudo leer la preferencia de demo mode:', error);
    }

    return {
        isEnabled() {
            return enabled;
        },
        setEnabled(flag) {
            enabled = Boolean(flag);
            try {
                localStorage.setItem(DEMO_STORAGE_KEY, enabled);
            } catch (error) {
                console.warn('No se pudo guardar la preferencia de demo mode:', error);
            }
        },
        toggle() {
            this.setEnabled(!enabled);
            return enabled;
        }
    };
})();

const isDemoMode = () => DemoModeController.isEnabled();

window.EstudiaProDemo = {
    isEnabled: () => DemoModeController.isEnabled(),
    enable: () => DemoModeController.setEnabled(true),
    disable: () => DemoModeController.setEnabled(false),
    toggle: () => DemoModeController.toggle()
};

// --- API CONFIGURATION ---
const API_CONFIG = {
    BASE_URL: DEFAULT_API_BASE_URL,
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            VERIFY: '/auth/verify',
            LOGOUT: '/auth/logout'
        },
        USERS: {
            GET_PROFILE: '/auth/profile',
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

// --- HARDCODED DATASETS (based on fepipro demo) ---
const HARDCODED_DATA = {
    notifications: [
        {
            id: 'notif-1',
            title: 'Examen de Álgebra en 48h',
            message: 'Agenda un simulacro corto para validar tu progreso antes del examen de Álgebra.',
            type: 'alert',
            read: false,
            date: '2024-05-24T10:02:00Z'
        },
        {
            id: 'notif-2',
            title: 'Nuevo recurso recomendado',
            message: 'Andrea Ríos compartió el formulario actualizado de integrales que buscabas.',
            type: 'info',
            read: false,
            date: '2024-05-23T15:45:00Z'
        },
        {
            id: 'notif-3',
            title: 'Racha de estudio activa',
            message: 'Ya llevas 6 días seguidos cumpliendo tu meta diaria. ¡No rompas la racha!',
            type: 'success',
            read: true,
            date: '2024-05-22T08:15:00Z'
        }
    ],
    activities: {
        upcoming: [
            { id: 'act-1', title: 'Cálculo - Parcial 1', date: 'Mañana, 10:00 AM', type: 'Examen' },
            { id: 'act-2', title: 'Álgebra Lineal - Quiz 2', date: 'Viernes, 2:00 PM', type: 'Quiz' },
            { id: 'act-3', title: 'Mentoría con Alejandra', date: 'Sábado, 9:00 AM', type: 'Tutoría' }
        ],
        studyTips: [
            'Practica 20 minutos diarios de derivadas antes de dormir.',
            'Anota las fórmulas nuevas en el formulario personalizable.',
            'Si te atoras, lanza un tema en el foro o agenda una tutoría SOS.'
        ],
        spotlightSearches: [
            'Derivadas por definición',
            'Espacios vectoriales para ingeniería',
            'Integrales con cambio de variable'
        ]
    },
    subjectsCatalog: [
        {
            id: 'calc-1',
            title: 'Cálculo Diferencial',
            description: 'Domina límites, derivadas y aplicaciones esenciales para ingeniería.',
            professor: 'Dra. Sofía Reyes',
            school: 'ESCOM',
            progress: 68,
            level: 'Intermedio',
            temario: [
                { title: 'Límites y continuidad' },
                { title: 'Derivadas y reglas principales' },
                { title: 'Aplicaciones de la derivada' },
                { title: 'Optimización y máximos relativos' }
            ]
        },
        {
            id: 'alg-2',
            title: 'Álgebra Lineal Avanzada',
            description: 'Matrices, espacios vectoriales y diagonalización con casos reales.',
            professor: 'Mtro. Armando Flores',
            school: 'ESCOM',
            progress: 55,
            level: 'Avanzado',
            temario: [
                { title: 'Matrices y determinantes' },
                { title: 'Sistemas de ecuaciones' },
                { title: 'Espacios vectoriales' },
                { title: 'Transformaciones lineales' }
            ]
        },
        {
            id: 'ecu-1',
            title: 'Ecuaciones Diferenciales',
            description: 'Aprende a modelar sistemas dinámicos con ecuaciones reales.',
            professor: 'Dra. Julieta Morales',
            school: 'IPN',
            progress: 32,
            level: 'Intermedio',
            temario: [
                { title: 'Ecuaciones de primer orden' },
                { title: 'Método de coeficientes indeterminados' },
                { title: 'Transformada de Laplace' }
            ]
        },
        {
            id: 'prob-1',
            title: 'Probabilidad y Estadística',
            description: 'Distribuciones, inferencia y visualización de datos aplicada.',
            professor: 'Mtra. Paula Navarro',
            school: 'ESCOM',
            progress: 40,
            level: 'Básico',
            temario: [
                { title: 'Combinatoria y conteo' },
                { title: 'Variables aleatorias' },
                { title: 'Distribuciones clásicas' },
                { title: 'Intervalos de confianza' }
            ]
        }
    ],
    userSubjects: [
        {
            id: 'calc-1',
            title: 'Cálculo Diferencial',
            professor: 'Dra. Sofía Reyes',
            school: 'ESCOM',
            progress: 68,
            examDate: '2025-09-22',
            temario: [
                { title: 'Límites y continuidad' },
                { title: 'Derivadas y reglas principales' },
                { title: 'Aplicaciones de la derivada' },
                { title: 'Optimización y máximos relativos' }
            ]
        },
        {
            id: 'alg-2',
            title: 'Álgebra Lineal Avanzada',
            professor: 'Mtro. Armando Flores',
            school: 'ESCOM',
            progress: 55,
            examDate: '2025-10-15',
            temario: [
                { title: 'Matrices y determinantes' },
                { title: 'Sistemas de ecuaciones' },
                { title: 'Espacios vectoriales' },
                { title: 'Transformaciones lineales' }
            ]
        },
        {
            id: 'prob-1',
            title: 'Probabilidad y Estadística',
            professor: 'Mtra. Paula Navarro',
            school: 'ESCOM',
            progress: 40,
            examDate: '2025-11-05',
            temario: [
                { title: 'Combinatoria y conteo' },
                { title: 'Variables aleatorias' },
                { title: 'Distribuciones clásicas' }
            ]
        }
    ],
    resources: [
        {
            id: 'res-001',
            title: 'Guía Premium de Derivadas',
            author: 'Andrea Ríos',
            subjectId: 'calc-1',
            subjectName: 'Cálculo Diferencial',
            type: 'pdf',
            price: 89,
            rating: 4.9,
            downloads: 245,
            free: false
        },
        {
            id: 'res-002',
            title: 'Banco de Exámenes ESCOM - Álgebra',
            author: 'Carlos Trejo',
            subjectId: 'alg-2',
            subjectName: 'Álgebra Lineal Avanzada',
            type: 'exam',
            price: 129,
            rating: 4.8,
            downloads: 178,
            free: false
        },
        {
            id: 'res-003',
            title: 'Formulario Visual de Integrales',
            author: 'Mariana Pineda',
            subjectId: 'calc-1',
            subjectName: 'Cálculo Diferencial',
            type: 'formula',
            price: 0,
            rating: 4.7,
            downloads: 312,
            free: true
        },
        {
            id: 'res-004',
            title: 'Plantillas Notion para plan de estudio',
            author: 'Edgar Díaz',
            subjectId: 'prob-1',
            subjectName: 'Probabilidad',
            type: 'pdf',
            price: 59,
            rating: 4.5,
            downloads: 97,
            free: false
        }
    ],
    purchasedResourceIds: ['res-001', 'res-003'],
    exams: [
        {
            id: 'exam-derivadas',
            subjectId: 'calc-1',
            subjectName: 'Cálculo Diferencial',
            title: 'Simulacro Parcial 1 - Derivadas',
            duration: 3600,
            questions: [
                {
                    id: 'q-1',
                    text: 'Calcula la derivada de f(x) = 3x^4 - 5x^2 + 2',
                    answer: '12x^3-10x',
                    explanation: 'Aplica la regla del poder a cada término.',
                    wolframQuery: 'derivative 3x^4-5x^2+2'
                },
                {
                    id: 'q-2',
                    text: 'Evalúa la integral \n\\int_0^1 2x \\; dx',
                    answer: '1',
                    explanation: 'La antiderivada de 2x es x^2. Evalúa entre 0 y 1.',
                    wolframQuery: 'integrate 2x from 0 to 1'
                },
                {
                    id: 'q-3',
                    text: 'Resuelve el límite \\\\lim_{x \\to 0} \\frac{\\sin(3x)}{x}',
                    answer: '3',
                    explanation: 'Usa el límite notable sin(x)/x = 1.',
                    wolframQuery: 'limit sin(3x)/x as x->0'
                }
            ]
        }
    ],
    formularies: [
        { id: 'form-1', title: 'Tabla Premium de Derivadas', subject: 'Cálculo', type: 'PDF', url: '#' },
        { id: 'form-2', title: 'Identidades Trigonométricas', subject: 'Álgebra', type: 'PDF', url: '#' },
        { id: 'form-3', title: 'Formulario de Laplace', subject: 'Ecuaciones Diferenciales', type: 'PDF', url: '#' }
    ],
    tutors: [
        {
            id: 'tutor-ale',
            name: 'Alejandra Ruiz',
            rating: 4.9,
            sessions: 128,
            specialties: 'Cálculo, Álgebra',
            bio: 'Coach académica con 6 años ayudando a pasar extraordinarios.',
            tariff30: 180,
            tariff60: 320
        },
        {
            id: 'tutor-ian',
            name: 'Ian Salazar',
            rating: 4.7,
            sessions: 86,
            specialties: 'Probabilidad, Estadística',
            bio: 'Te ayudo a traducir problemas de datos a pasos simples.',
            tariff30: 160,
            tariff60: 290
        },
        {
            id: 'tutor-rosa',
            name: 'Rosa Vera',
            rating: 4.8,
            sessions: 102,
            specialties: 'Ecuaciones Diferenciales',
            bio: 'Explico con gráficas interactivas y ejemplos reales.',
            tariff30: 200,
            tariff60: 340
        }
    ],
    forums: [
        {
            id: 'forum-1',
            title: '¿Cómo factorizar un polinomio cúbico rápido?',
            subjectName: 'Álgebra Lineal',
            postCount: 12,
            lastActivity: '2024-05-23T12:30:00Z'
        },
        {
            id: 'forum-2',
            title: 'Tips para dominar integrales por partes',
            subjectName: 'Cálculo Diferencial',
            postCount: 18,
            lastActivity: '2024-05-22T19:10:00Z'
        },
        {
            id: 'forum-3',
            title: '¿Cómo iniciar con ecuaciones diferenciales?',
            subjectName: 'Ecuaciones Diferenciales',
            postCount: 9,
            lastActivity: '2024-05-21T08:45:00Z'
        }
    ],
    achievements: [
        { id: 'ach-1', title: 'Primer Sprint', description: 'Completaste tu primera semana estudiando diario.', icon: '🚀', date: '2024-05-10' },
        { id: 'ach-2', title: 'Explorador', description: 'Agregaste 3 materias a tu panel.', icon: '🧭', date: '2024-05-14' },
        { id: 'ach-3', title: 'SOS Master', description: 'Agendaste 2 tutorías en un mes.', icon: '🧑‍🏫', date: '2024-05-18' }
    ],
    demoProfile: {
        id: 'demo-1',
        username: 'daniela.demo',
        email: 'demo@estudiapro.com',
        first_name: 'Daniela',
        last_name: 'Yáñez',
        name: 'Daniela Yáñez',
        rol: 'ESTUDIANTE',
        foto_perfil_url: '',
        nivel: 3,
        puntos_gamificacion: 820,
        streak: 6,
        subjects: ['calc-1', 'alg-2', 'prob-1']
    }
};

window.HARDCODED_DATA = HARDCODED_DATA;

const DEMO_USER = HARDCODED_DATA.demoProfile;

// --- HELPERS ---
const formatUserForFrontend = (rawUser) => {
    if (!rawUser) return null;
    const firstName = rawUser.first_name || rawUser.firstName || '';
    const lastName = rawUser.last_name || rawUser.lastName || '';
    const displayName = rawUser.name || `${firstName} ${lastName}`.trim() || rawUser.username || rawUser.email || 'Usuario';
    const normalizedRole = (rawUser.rol || rawUser.role || 'estudiante').toString().toLowerCase();

    return {
        id: rawUser.id,
        username: rawUser.username || rawUser.email,
        email: rawUser.email,
        name: displayName,
        role: normalizedRole,
        firstName,
        lastName,
        photo: rawUser.foto_perfil_url || rawUser.photo || null,
        stats: {
            level: rawUser.nivel || rawUser.stats?.level || 1,
            points: rawUser.puntos_gamificacion || rawUser.stats?.points || 0,
            streak: rawUser.streak || rawUser.racha || rawUser.stats?.streak || 0
        },
        raw: rawUser
    };
};

const DemoAPI = {
    async simulateLatency() {
        return new Promise(resolve => setTimeout(resolve, DEMO_LATENCY));
    },

    nextId(prefix) {
        return `${prefix}-${Date.now()}`;
    },

    async handle(endpoint, method, data) {
        await this.simulateLatency();

        // AUTH
        if (endpoint === API_CONFIG.ENDPOINTS.AUTH.LOGIN && method === 'POST') {
            const identifier = (data?.email || data?.username || '').toLowerCase();
            if ((identifier === DEMO_USER.email.toLowerCase() || identifier === DEMO_USER.username.toLowerCase()) && data?.password === 'demo123') {
                localStorage.setItem('authToken', 'demo-token');
                return { success: true, token: 'demo-token', user: formatUserForFrontend(DEMO_USER) };
            }
            return { success: false, message: 'Credenciales inválidas (demo@estudiapro.com / demo123)' };
        }

        if (endpoint === API_CONFIG.ENDPOINTS.AUTH.REGISTER && method === 'POST') {
            return { success: true, message: 'Registro simulado. Inicia sesión con demo@estudiapro.com / demo123' };
        }

        if (endpoint === API_CONFIG.ENDPOINTS.AUTH.LOGOUT) {
            localStorage.removeItem('authToken');
            return { success: true };
        }

        // USER PROFILE
        if (endpoint === API_CONFIG.ENDPOINTS.USERS.GET_PROFILE) {
            const token = localStorage.getItem('authToken');
            if (token !== 'demo-token') {
                throw new Error('Sesión expirada en modo demo');
            }
            return formatUserForFrontend(DEMO_USER);
        }

        // SUBJECTS
        if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL) {
            return deepClone(HARDCODED_DATA.subjectsCatalog);
        }

        if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.GET_USER_SUBJECTS) {
            return deepClone(HARDCODED_DATA.userSubjects);
        }

        if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.ADD_SUBJECT && method === 'POST') {
            const subject = HARDCODED_DATA.subjectsCatalog.find(s => s.id === data?.subjectId);
            if (subject && !HARDCODED_DATA.userSubjects.find(s => s.id === subject.id)) {
                HARDCODED_DATA.userSubjects.push({ ...deepClone(subject), examDate: null });
            }
            return { success: true };
        }

        if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.UPDATE_EXAM_DATE && method === 'PUT') {
            const subject = HARDCODED_DATA.userSubjects.find(s => s.id === data?.subjectId);
            if (subject) subject.examDate = data.examDate;
            return { success: true };
        }

        // RESOURCES
        if (endpoint === API_CONFIG.ENDPOINTS.RESOURCES.GET_ALL) {
            return deepClone(HARDCODED_DATA.resources);
        }

        if (endpoint === API_CONFIG.ENDPOINTS.RESOURCES.GET_PURCHASED) {
            const purchased = HARDCODED_DATA.resources.filter(r => HARDCODED_DATA.purchasedResourceIds.includes(r.id));
            return deepClone(purchased);
        }

        if (endpoint === API_CONFIG.ENDPOINTS.RESOURCES.PURCHASE && method === 'POST') {
            if (data?.resourceId && !HARDCODED_DATA.purchasedResourceIds.includes(data.resourceId)) {
                HARDCODED_DATA.purchasedResourceIds.push(data.resourceId);
            }
            return { success: true };
        }

        if (endpoint === API_CONFIG.ENDPOINTS.RESOURCES.DOWNLOAD && method === 'POST') {
            return { success: true, url: '#' };
        }

        // FORMULARIES
        if (endpoint === API_CONFIG.ENDPOINTS.FORMULARIES.GET_ALL) {
            return deepClone(HARDCODED_DATA.formularies);
        }

        // ACHIEVEMENTS
        if (endpoint === API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_ALL || endpoint === API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_USER_ACHIEVEMENTS) {
            return deepClone(HARDCODED_DATA.achievements);
        }

        // EXAMS
        if (endpoint === API_CONFIG.ENDPOINTS.EXAMS.GET_ALL) {
            return deepClone(HARDCODED_DATA.exams);
        }

        if (endpoint === API_CONFIG.ENDPOINTS.EXAMS.START_EXAM && method === 'POST') {
            const exam = HARDCODED_DATA.exams.find(e => e.id === data?.examId);
            if (!exam) throw new Error('Examen no encontrado (demo)');
            return deepClone(exam);
        }

        if (endpoint === API_CONFIG.ENDPOINTS.EXAMS.SUBMIT_EXAM && method === 'POST') {
            const exam = HARDCODED_DATA.exams.find(e => e.id === data?.examId);
            if (!exam) throw new Error('Examen no encontrado (demo)');
            const answers = data?.answers || {};
            const correct = exam.questions.filter(q => (answers[q.id] || '').replace(/\s+/g, '').toLowerCase() === q.answer.replace(/\s+/g, '').toLowerCase()).length;
            const total = exam.questions.length;
            return {
                calificacion: Math.round((correct / total) * 100),
                correctas: correct,
                total
            };
        }

        // TUTORS
        if (endpoint === API_CONFIG.ENDPOINTS.TUTORS.GET_ALL) {
            return deepClone(HARDCODED_DATA.tutors);
        }

        if (endpoint === API_CONFIG.ENDPOINTS.TUTORS.SCHEDULE && method === 'POST') {
            return { success: true, message: 'Tutoría agendada (demo)' };
        }

        // FORUMS
        if (endpoint === API_CONFIG.ENDPOINTS.FORUMS.GET_ALL) {
            return deepClone(HARDCODED_DATA.forums);
        }

        if (endpoint === API_CONFIG.ENDPOINTS.FORUMS.CREATE_TOPIC && method === 'POST') {
            const newTopic = {
                id: this.nextId('forum'),
                title: data?.title || 'Tema sin título',
                subjectName: (HARDCODED_DATA.subjectsCatalog.find(s => s.id === data?.subjectId)?.title) || 'General',
                postCount: 0,
                lastActivity: new Date().toISOString()
            };
            HARDCODED_DATA.forums.unshift(newTopic);
            return { success: true, topic: deepClone(newTopic) };
        }

        if (endpoint.startsWith(API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC)) {
            const topicId = endpoint.split('/').pop();
            const topic = HARDCODED_DATA.forums.find(f => f.id === topicId);
            return {
                id: topicId,
                title: topic?.title || 'Tema',
                posts: [
                    { id: 'post-1', author: 'Monitor IA', content: 'Comparte tus pasos y te ayudamos a detectar dónde hubo un error.', createdAt: new Date().toISOString() }
                ]
            };
        }

        // NOTIFICATIONS
        if (endpoint === API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_USER_NOTIFICATIONS) {
            return deepClone(HARDCODED_DATA.notifications);
        }

        if (endpoint === API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ && method === 'POST') {
            const notification = HARDCODED_DATA.notifications.find(n => n.id === data?.notificationId);
            if (notification) notification.read = true;
            return { success: true };
        }

        // ADMIN placeholders
        if (endpoint === API_CONFIG.ENDPOINTS.ADMIN.USERS) {
            return [];
        }

        if (endpoint === API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS) {
            return [];
        }

        return {};
    }
};

// --- API SERVICE ---
const apiService = {
    async request(endpoint, method = 'GET', data = null, requiresAuth = true) {
        if (isDemoMode()) {
            return DemoAPI.handle(endpoint, method, data);
        }

        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (requiresAuth) {
            const token = localStorage.getItem('authToken');
            if (token) {
                headers['Authorization'] = `Token ${token}`;
            }
        }

        const options = {
            method,
            headers,
            credentials: 'include'
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    },

    // Autenticación
    async login(identifier, password) {
        const payload = isDemoMode()
            ? { email: identifier, password }
            : { username: identifier, password };

        try {
            const raw = await this.request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, 'POST', payload, false);
            if (raw?.success && raw?.token) {
                return raw;
            }
            if (raw?.token) {
                return { success: true, token: raw.token, user: formatUserForFrontend(raw.usuario || raw.user || raw) };
            }
            return { success: false, message: raw?.message || 'Respuesta inesperada del servidor' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async register(userData) {
        try {
            const response = await this.request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, 'POST', userData, false);
            if (response?.success) {
                return response;
            }
            return { success: true, message: response?.message || 'Registro exitoso' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    async verify(email, code) {
        return this.request(API_CONFIG.ENDPOINTS.AUTH.VERIFY, 'POST', { email, code }, false);
    },

    async logout() {
        return this.request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, 'POST');
    },

    // Usuarios
    async getProfile() {
        const profile = await this.request(API_CONFIG.ENDPOINTS.USERS.GET_PROFILE);
        return isDemoMode() ? profile : formatUserForFrontend(profile);
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

    async getPurchasedResources() {
        return this.request(API_CONFIG.ENDPOINTS.RESOURCES.GET_PURCHASED);
    },

    async purchaseResource(resourceId) {
        return this.request(API_CONFIG.ENDPOINTS.RESOURCES.PURCHASE, 'POST', { resourceId });
    },

    async downloadResource(resourceId) {
        return this.request(API_CONFIG.ENDPOINTS.RESOURCES.DOWNLOAD, 'POST', { resourceId });
    },

    async getAllFormularies() {
        return this.request(API_CONFIG.ENDPOINTS.FORMULARIES.GET_ALL);
    },

    async getAllAchievements() {
        return this.request(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_ALL);
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

    showNotification(title, message) {
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'fixed top-4 right-4 z-50 w-80 space-y-3 pointer-events-none';
            document.body.appendChild(container);
        }

        const notif = document.createElement('div');
        notif.className = 'glass-effect-light p-4 rounded-xl mb-3 animate-modal-in border-l-4 border-primary bg-white dark:bg-dark-card shadow-lg pointer-events-auto';
        notif.innerHTML = `
            <div class="flex justify-between items-start">
                <h4 class="font-bold text-sm">${title}</h4>
                <button class="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Cerrar notificación">✕</button>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">${message}</p>
        `;

        const closeBtn = notif.querySelector('button');
        closeBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            notif.remove();
        });

        container.appendChild(notif);
        setTimeout(() => {
            if (notif.parentNode) notif.remove();
        }, 5000);
    },

    showLoading(show) {
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
        } else if (loader) {
            loader.classList.add('hidden');
        }
    },

    init() {
        this.applyTheme();

        const themeToggles = document.querySelectorAll('[id$="theme-toggle"]');
        themeToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleTheme());
        });

        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const wrapper = event.currentTarget.closest('.relative');
                if (!wrapper) return;
                const input = wrapper.querySelector('input');
                if (!input) return;

                if (input.type === 'password') {
                    input.type = 'text';
                    event.currentTarget.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>';
                } else {
                    input.type = 'password';
                    event.currentTarget.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>';
                }
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Global.init();
});
