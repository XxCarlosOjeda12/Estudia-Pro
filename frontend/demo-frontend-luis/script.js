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
            GET_USER_ACHIEVEMENTS: '/users/achievements'
        },
        NOTIFICATIONS: {
            GET_USER_NOTIFICATIONS: '/users/notifications',
            MARK_READ: '/users/notifications/read'
        },
        ADMIN: {
            USERS: '/admin/users',
            SUBJECTS: '/admin/subjects',
            RESOURCES: '/admin/resources'
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
                return { success: true, message: 'Registro simulado (modo demo)'};
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
                return [ { id: 'm1', title: 'Álgebra Básica', examDate: null } ];
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

// --- APP STATE & LOGIC ---
const app = {
    state: {
        currentPage: 'login',
        currentUser: null,
        currentSubject: null,
        currentExam: null,
        currentResource: null,
        currentForum: null,
        theme: localStorage.getItem('theme') || 'dark',
        examTimer: null,
        examTimeLeft: 0,
        activeMathField: null,
        examAnswers: {},
        isLoading: false,
        // Cache para datos
        cache: {
            subjects: null,
            resources: null,
            exams: null,
            tutors: null,
            forums: null,
            lastUpdated: {}
        }
    },

    async init() {
        // DOM Elements
        this.dom = {
            appContainer: document.getElementById('app-container'),
            loginPage: document.getElementById('login-page'),
            mainApp: document.getElementById('main-app'),
            mainContent: document.getElementById('main-content'),
            modalsContainer: document.getElementById('modals-container'),
            notificationsContainer: document.getElementById('notifications-container'),
            sidebar: document.getElementById('sidebar'),
            nav: document.getElementById('main-nav'),
            mobileNav: document.getElementById('mobile-nav'),
            userName: document.getElementById('user-name'),
            userRole: document.getElementById('user-role'),
            mobileUserName: document.getElementById('mobile-user-name'),
            mobileUserRole: document.getElementById('mobile-user-role'),
            themeToggle: document.getElementById('theme-toggle'),
            mobileThemeToggle: document.getElementById('mobile-theme-toggle'),
            loginForm: document.getElementById('login-form'),
            registerForm: document.getElementById('register-form'),
            loginFormContainer: document.getElementById('login-form-container'),
            roleSelectionContainer: document.getElementById('role-selection-container'),
            userSubjects: document.getElementById('user-subjects'),
            userSubjectsList: document.getElementById('user-subjects-list'),
            mobileUserSubjects: document.getElementById('mobile-user-subjects'),
            mobileUserSubjectsList: document.getElementById('mobile-user-subjects-list'),
            tabLogin: document.getElementById('tab-login'),
            tabRegister: document.getElementById('tab-register'),
            mobileMenuButton: document.getElementById('mobile-menu-button'),
            mobileMenu: document.getElementById('mobile-menu'),
            closeMobileMenu: document.getElementById('close-mobile-menu'),
            togglePassword: document.getElementById('toggle-password')
        };

        // Event Listeners
        this.dom.loginForm.addEventListener('submit', this.handleLoginAttempt.bind(this));
        this.dom.registerForm.addEventListener('submit', this.handleRegisterAttempt.bind(this));
        this.dom.themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        this.dom.mobileThemeToggle.addEventListener('click', this.toggleTheme.bind(this));
        this.dom.tabLogin.addEventListener('click', () => this.switchAuthTab('login'));
        this.dom.tabRegister.addEventListener('click', () => this.switchAuthTab('register'));
        this.dom.mobileMenuButton.addEventListener('click', this.toggleMobileMenu.bind(this));
        this.dom.closeMobileMenu.addEventListener('click', this.toggleMobileMenu.bind(this));
        
        if (this.dom.togglePassword) {
            this.dom.togglePassword.addEventListener('click', this.togglePasswordVisibility.bind(this));
        }
        
        // Toggle password visibility for all password fields
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.currentTarget.parentElement.querySelector('input');
                if (input.type === 'password') {
                    input.type = 'text';
                    e.currentTarget.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>';
                } else {
                    input.type = 'password';
                    e.currentTarget.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>';
                }
            });
        });

        // Check if user is already logged in
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                await this.loadUserProfile();
            } catch (error) {
                localStorage.removeItem('authToken');
                this.state.currentUser = null;
            }
        }

        // Initial Setup
        this.applyTheme();
        this.render();
    },

    // --- AUTH METHODS ---
    switchAuthTab(tab) {
        if (tab === 'login') {
            this.dom.tabLogin.classList.add('active');
            this.dom.tabRegister.classList.remove('active');
            this.dom.loginForm.classList.remove('hidden');
            this.dom.registerForm.classList.add('hidden');
        } else {
            this.dom.tabRegister.classList.add('active');
            this.dom.tabLogin.classList.remove('active');
            this.dom.registerForm.classList.remove('hidden');
            this.dom.loginForm.classList.add('hidden');
        }
    },

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            this.dom.togglePassword.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>';
        } else {
            passwordInput.type = 'password';
            this.dom.togglePassword.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>';
        }
    },

    toggleMobileMenu() {
        this.dom.mobileMenu.classList.toggle('translate-x-0');
        this.dom.mobileMenu.classList.toggle('-translate-x-full');
    },

    async handleLoginAttempt(e) {
        e.preventDefault();
        const email = this.dom.loginForm.querySelector('#email').value;
        const password = this.dom.loginForm.querySelector('#password').value;
        const errorEl = this.dom.loginForm.querySelector('#login-error');
        
        try {
            this.showLoading(true);
            const response = await apiService.login(email, password);
            
            if (response.success && response.token) {
                localStorage.setItem('authToken', response.token);
                await this.loadUserProfile();
                this.dom.loginFormContainer.classList.add('hidden');
                this.dom.roleSelectionContainer.classList.remove('hidden');
            } else {
                errorEl.classList.remove('hidden');
                errorEl.textContent = response.message || 'Error en el inicio de sesión';
            }
        } catch (error) {
            errorEl.classList.remove('hidden');
            errorEl.textContent = error.message || 'Error de conexión con el servidor';
        } finally {
            this.showLoading(false);
        }
    },

    async handleRegisterAttempt(e) {
        e.preventDefault();
        const name = this.dom.registerForm.querySelector('#register-name').value;
        const email = this.dom.registerForm.querySelector('#register-email').value;
        const password = this.dom.registerForm.querySelector('#register-password').value;
        const confirmPassword = this.dom.registerForm.querySelector('#register-confirm-password').value;
        const errorEl = this.dom.registerForm.querySelector('#register-error');
        
        if (password !== confirmPassword) {
            errorEl.classList.remove('hidden');
            errorEl.textContent = 'Las contraseñas no coinciden.';
            return;
        }
        
        try {
            this.showLoading(true);
            const userData = {
                name,
                email,
                password,
                role: 'estudiante' // Rol por defecto
            };
            
            const response = await apiService.register(userData);
            
            if (response.success) {
                this.showVerificationModal(email);
            } else {
                errorEl.classList.remove('hidden');
                errorEl.textContent = response.message || 'Error en el registro';
            }
        } catch (error) {
            errorEl.classList.remove('hidden');
            errorEl.textContent = error.message || 'Error de conexión con el servidor';
        } finally {
            this.showLoading(false);
        }
    },

    showVerificationModal(email) {
        const modalHTML = `
        <div id="verification-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 transform transition-all scale-95 opacity-0 animate-modal-in">
                <div class="flex justify-between items-center mb-4">
                     <h2 class="text-2xl font-bold">Verificación de Cuenta</h2>
                     <button onclick="app.closeModal('verification-modal')" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <p class="text-slate-500 dark:text-slate-400 mb-6">Hemos enviado un código de verificación a <strong>${email}</strong>. Por favor ingrésalo a continuación.</p>
                <div class="space-y-4">
                    <div>
                        <label for="verification-code" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Código de verificación</label>
                        <input type="text" id="verification-code" class="w-full px-4 py-2 bg-white/50 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" placeholder="123456" required>
                    </div>
                    <button onclick="app.verifyCode('${email}')" class="w-full bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-transform transform hover:scale-105">Verificar</button>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-4">¿No recibiste el código? <button onclick="app.resendCode('${email}')" class="text-primary hover:underline">Reenviar</button></p>
            </div>
        </div>`;
        
        this.dom.modalsContainer.innerHTML = modalHTML;
    },

    async verifyCode(email) {
        const codeInput = document.getElementById('verification-code');
        const code = codeInput.value;
        
        try {
            const response = await apiService.verify(email, code);
            if (response.success) {
                this.closeModal('verification-modal');
                this.showNotification('Cuenta verificada', '¡Tu cuenta ha sido verificada exitosamente! Ahora puedes iniciar sesión.');
                this.switchAuthTab('login');
            } else {
                codeInput.classList.add('border-red-500');
                setTimeout(() => codeInput.classList.remove('border-red-500'), 1000);
            }
        } catch (error) {
            codeInput.classList.add('border-red-500');
        }
    },

    async resendCode(email) {
        try {
            // Endpoint para reenviar código
            const response = await apiService.request('/auth/resend-code', 'POST', { email }, false);
            this.showNotification('Código reenviado', `Se ha reenviado el código de verificación a ${email}`);
        } catch (error) {
            this.showNotification('Error', 'No se pudo reenviar el código. Intenta nuevamente.');
        }
    },

    async loadUserProfile() {
        try {
            const profile = await apiService.getProfile();
            this.state.currentUser = profile;
            this.navigateTo('panel');
        } catch (error) {
            console.error('Error loading profile:', error);
            throw error;
        }
    },

    async login(role) {
        // En una implementación real, el rol vendría del backend
        this.state.currentUser.role = role;
        this.navigateTo('panel');
    },

    async logout() {
        try {
            await apiService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('authToken');
        this.state.currentUser = null;
        this.state.currentPage = 'login';
        this.dom.loginFormContainer.classList.remove('hidden');
        this.dom.roleSelectionContainer.classList.add('hidden');
        this.dom.loginForm.reset();
        this.dom.registerForm.reset();
        this.dom.loginForm.querySelector('#login-error').classList.add('hidden');
        this.dom.registerForm.querySelector('#register-error').classList.add('hidden');
        this.switchAuthTab('login');
        this.render();
    },

    // --- DATA FETCHING METHODS ---
    async fetchSubjects(forceRefresh = false) {
        if (!forceRefresh && this.state.cache.subjects && 
            Date.now() - this.state.cache.lastUpdated.subjects < 300000) { // 5 minutos
            return this.state.cache.subjects;
        }
        
        try {
            const subjects = await apiService.getAllSubjects();
            this.state.cache.subjects = subjects;
            this.state.cache.lastUpdated.subjects = Date.now();
            return subjects;
        } catch (error) {
            console.error('Error fetching subjects:', error);
            throw error;
        }
    },

    async fetchUserSubjects() {
        try {
            return await apiService.getUserSubjects();
        } catch (error) {
            console.error('Error fetching user subjects:', error);
            return [];
        }
    },

    async fetchResources(forceRefresh = false) {
        if (!forceRefresh && this.state.cache.resources && 
            Date.now() - this.state.cache.lastUpdated.resources < 300000) {
            return this.state.cache.resources;
        }
        
        try {
            const resources = await apiService.getAllResources();
            this.state.cache.resources = resources;
            this.state.cache.lastUpdated.resources = Date.now();
            return resources;
        } catch (error) {
            console.error('Error fetching resources:', error);
            throw error;
        }
    },

    async fetchExams(forceRefresh = false) {
        if (!forceRefresh && this.state.cache.exams && 
            Date.now() - this.state.cache.lastUpdated.exams < 300000) {
            return this.state.cache.exams;
        }
        
        try {
            const exams = await apiService.getAllExams();
            this.state.cache.exams = exams;
            this.state.cache.lastUpdated.exams = Date.now();
            return exams;
        } catch (error) {
            console.error('Error fetching exams:', error);
            throw error;
        }
    },

    async fetchTutors(forceRefresh = false) {
        if (!forceRefresh && this.state.cache.tutors && 
            Date.now() - this.state.cache.lastUpdated.tutors < 300000) {
            return this.state.cache.tutors;
        }
        
        try {
            const tutors = await apiService.getAllTutors();
            this.state.cache.tutors = tutors;
            this.state.cache.lastUpdated.tutors = Date.now();
            return tutors;
        } catch (error) {
            console.error('Error fetching tutors:', error);
            throw error;
        }
    },

    async fetchForums(forceRefresh = false) {
        if (!forceRefresh && this.state.cache.forums && 
            Date.now() - this.state.cache.lastUpdated.forums < 300000) {
            return this.state.cache.forums;
        }
        
        try {
            const forums = await apiService.getAllForums();
            this.state.cache.forums = forums;
            this.state.cache.lastUpdated.forums = Date.now();
            return forums;
        } catch (error) {
            console.error('Error fetching forums:', error);
            throw error;
        }
    },

    // --- NAVIGATION ---
    async navigateTo(page, context = null) {
        this.state.currentPage = page;
        
        if (context && context.subjectId) {
            try {
                const subjects = await this.fetchSubjects();
                this.state.currentSubject = subjects.find(m => m.id === context.subjectId);
            } catch (error) {
                this.state.currentSubject = null;
            }
        }
        
        if (context && context.examId) {
            try {
                const exams = await this.fetchExams();
                this.state.currentExam = exams.find(e => e.id === context.examId);
            } catch (error) {
                this.state.currentExam = null;
            }
        }
        
        if (context && context.resourceId) {
            try {
                const resources = await this.fetchResources();
                this.state.currentResource = resources.find(r => r.id === context.resourceId);
            } catch (error) {
                this.state.currentResource = null;
            }
        }
        
        if (context && context.forumId) {
            try {
                const forums = await this.fetchForums();
                this.state.currentForum = forums.find(f => f.id === context.forumId);
            } catch (error) {
                this.state.currentForum = null;
            }
        }
        
        this.render();
        window.scrollTo(0, 0);
    },
    
    // --- THEME ---
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

    // --- RENDER FUNCTIONS ---
    async render() {
        if (!this.state.currentUser) {
            this.dom.loginPage.classList.add('active');
            this.dom.mainApp.classList.add('hidden');
            this.dom.mainApp.classList.remove('flex');
        } else {
            this.dom.loginPage.classList.remove('active');
            this.dom.mainApp.classList.remove('hidden');
            this.dom.mainApp.classList.add('flex');
            
            this.dom.userName.textContent = this.state.currentUser.name;
            this.dom.userRole.textContent = this.state.currentUser.role;
            this.dom.mobileUserName.textContent = this.state.currentUser.name;
            this.dom.mobileUserRole.textContent = this.state.currentUser.role;
            
            this.renderNav();
            await this.renderUserSubjects();
            await this.renderPage();
        }
        
        // Render LaTeX in the document
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
    },
    
    renderNav() {
        let pages = [];
        
        if (this.state.currentUser.role === 'estudiante') {
            pages = [
                { id: 'panel', name: 'Mi Panel', icon: 'layout-dashboard' },
                { id: 'explorar', name: 'Explorar Materias', icon: 'search' },
                { id: 'recursos', name: 'Recursos Comunidad', icon: 'users' },
                { id: 'foro', name: 'Foro de Ayuda', icon: 'message-circle' },
                { id: 'formularios', name: 'Formularios', icon: 'file-text' },
                { id: 'progreso', name: 'Mi Progreso', icon: 'trending-up' },
                { id: 'logros', name: 'Logros', icon: 'award' },
            ];
        } else if (this.state.currentUser.role === 'creador') {
            pages = [
                { id: 'panel', name: 'Mi Panel', icon: 'layout-dashboard' },
                { id: 'mis-recursos', name: 'Mis Recursos', icon: 'book' },
                { id: 'tutorias', name: 'Mis Tutorías', icon: 'calendar' },
            ];
        } else if (this.state.currentUser.role === 'admin') {
            pages = [
                { id: 'panel', name: 'Panel General', icon: 'layout-dashboard' },
                { id: 'gestion-usuarios', name: 'Gestionar Usuarios', icon: 'users' },
                { id: 'gestion-materias', name: 'Gestionar Materias', icon: 'book' },
            ];
        }
        
        const navItemHTML = (page) => `
            <a href="#" onclick="event.preventDefault(); app.navigateTo('${page.id}')" class="flex items-center p-3 rounded-lg transition-colors ${this.state.currentPage === page.id ? 'bg-primary/20 text-primary' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}">
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    ${this.getIconSVG(page.icon)}
                </svg>
                ${page.name}
            </a>
        `;
        
        this.dom.nav.innerHTML = pages.map(navItemHTML).join('');
        this.dom.mobileNav.innerHTML = pages.map(navItemHTML).join('');
    },

    getIconSVG(iconName) {
        const icons = {
            'layout-dashboard': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />',
            'search': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />',
            'users': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />',
            'trending-up': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />',
            'book': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />',
            'calendar': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />',
            'message-circle': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />',
            'file-text': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />',
            'award': '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />'
        };
        
        return icons[iconName] || '';
    },

    async renderUserSubjects() {
        if (this.state.currentUser.role === 'estudiante') {
            try {
                const userSubjects = await this.fetchUserSubjects();
                
                if (userSubjects && userSubjects.length > 0) {
                    this.dom.userSubjects.classList.remove('hidden');
                    this.dom.mobileUserSubjects.classList.remove('hidden');
                    
                    const subjectItemHTML = (subject) => `
                        <a href="#" onclick="event.preventDefault(); app.navigateTo('materia', {subjectId: '${subject.id}'})" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${this.state.currentPage === 'materia' && this.state.currentSubject && this.state.currentSubject.id === subject.id ? 'bg-primary/20 text-primary' : 'text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700'}">
                            <span class="w-2 h-2 rounded-full ${subject.progress > 70 ? 'bg-green-500' : subject.progress > 40 ? 'bg-yellow-500' : 'bg-red-500'}"></span>
                            ${subject.name}
                        </a>
                    `;
                    
                    this.dom.userSubjectsList.innerHTML = userSubjects.map(subjectItemHTML).join('');
                    this.dom.mobileUserSubjectsList.innerHTML = userSubjects.map(subjectItemHTML).join('');
                } else {
                    this.dom.userSubjects.classList.add('hidden');
                    this.dom.mobileUserSubjects.classList.add('hidden');
                }
            } catch (error) {
                console.error('Error rendering user subjects:', error);
                this.dom.userSubjects.classList.add('hidden');
                this.dom.mobileUserSubjects.classList.add('hidden');
            }
        } else {
            this.dom.userSubjects.classList.add('hidden');
            this.dom.mobileUserSubjects.classList.add('hidden');
        }
    },

    async renderPage() {
        const content = this.dom.mainContent;
        content.innerHTML = '';
        
        // Show loading state
        if (this.state.isLoading) {
            content.innerHTML = `
                <div class="flex justify-center items-center h-64">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            `;
            return;
        }
        
        let pageContent = '';
        
        try {
            switch(this.state.currentPage) {
                case 'panel':
                    pageContent = await this.getPanelHTML();
                    break;
                case 'explorar':
                    pageContent = await this.getExplorarHTML();
                    break;
                case 'materia':
                    pageContent = await this.getMateriaHTML();
                    break;
                case 'recursos':
                    pageContent = await this.getRecursosHTML();
                    break;
                case 'foro':
                    pageContent = await this.getForoHTML();
                    break;
                case 'formularios':
                    pageContent = await this.getFormulariosHTML();
                    break;
                case 'progreso':
                    pageContent = await this.getProgresoHTML();
                    break;
                case 'examen':
                    pageContent = await this.getExamenHTML();
                    break;
                case 'simulador':
                    pageContent = await this.getSimuladorHTML();
                    break;
                case 'mis-recursos':
                    pageContent = await this.getMisRecursosHTML();
                    break;
                case 'tutorias':
                    pageContent = await this.getTutoriasHTML();
                    break;
                case 'gestion-usuarios':
                    pageContent = await this.getGestionUsuariosHTML();
                    break;
                case 'gestion-materias':
                    pageContent = await this.getGestionMateriasHTML();
                    break;
                case 'logros':
                    pageContent = await this.getLogrosHTML();
                    break;
                default:
                    pageContent = `<h2 class="text-2xl font-bold">Página no encontrada</h2>`;
            }
        } catch (error) {
            console.error('Error rendering page:', error);
            pageContent = `
                <div class="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 class="text-xl font-bold mb-2">Error al cargar la página</h3>
                    <p class="text-slate-500">${error.message || 'Intenta recargar la página'}</p>
                </div>
            `;
        }
        
        content.innerHTML = pageContent;
        
        // Initialize page-specific functionality
        switch(this.state.currentPage) {
            case 'explorar':
                this.initExplorarListeners();
                break;
            case 'examen':
                this.initExamen();
                break;
            case 'progreso':
                this.renderProgreso();
                break;
            case 'simulador':
                this.initSimulador();
                break;
            case 'foro':
                this.initForoListeners();
                break;
            case 'recursos':
                this.initRecursosListeners();
                break;
        }
    },

    // --- PAGE TEMPLATES ---
    async getPanelHTML() {
        if (this.state.currentUser.role === 'estudiante') {
            return await this.getStudentPanelHTML();
        } else if (this.state.currentUser.role === 'creador') {
            return await this.getCreatorPanelHTML();
        } else if (this.state.currentUser.role === 'admin') {
            return await this.getAdminPanelHTML();
        }
        return '<h2>Panel no disponible</h2>';
    },

    async getStudentPanelHTML() {
        try {
            const userSubjects = await this.fetchUserSubjects();
            
            let alertHTML = '';
            if (userSubjects && userSubjects.length > 0) {
                const alert = userSubjects
                    .filter(s => s.examDate)
                    .sort((a,b) => new Date(a.examDate) - new Date(b.examDate))[0];
                
                if (alert) {
                    const diff = Math.ceil((new Date(alert.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    if (diff >= 0) {
                        alertHTML = `
                        <div class="bg-violet-500/20 border border-violet-500 text-violet-700 dark:text-violet-300 px-4 py-3 rounded-xl relative mb-8 flex items-center" role="alert">
                           <svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                           </svg>
                           <span class="block sm:inline">
                                <strong>Alerta Temprana:</strong> ¡Tu parcial de <strong>${alert.name}</strong> es en <strong>${diff} días</strong>!
                           </span>
                        </div>`;
                    }
                }
            }

            // Obtener notificaciones
            let newNotifications = 0;
            try {
                const notifications = await apiService.getUserNotifications();
                newNotifications = notifications.filter(n => !n.read).length;
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }

            // Obtener logros
            let achievementsHTML = '';
            try {
                const achievements = await apiService.getUserAchievements();
                const recentAchievements = achievements.slice(-3);
                
                if (recentAchievements.length > 0) {
                    achievementsHTML = recentAchievements.map(achievement => `
                        <div class="glass-effect-light p-4 rounded-2xl text-center">
                            <div class="text-3xl mb-2">${achievement.icon || '🏆'}</div>
                            <h3 class="font-semibold">${achievement.name}</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">${achievement.description}</p>
                        </div>
                    `).join('');
                } else {
                    achievementsHTML = `
                        <div class="col-span-3 text-center py-8 text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                            <p>Aún no has desbloqueado logros.</p>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error fetching achievements:', error);
            }

            const subjectsHTML = userSubjects && userSubjects.length > 0 
                ? userSubjects.map(subject => `
                    <div class="glass-effect-light p-6 rounded-2xl flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer" onclick="app.navigateTo('materia', {subjectId: '${subject.id}'})">
                        <div>
                            <div class="flex justify-between items-start">
                                <span class="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full">${subject.school || 'ESCOM'}</span>
                                ${subject.examDate ? `<span class="text-xs text-slate-500 dark:text-slate-400">Examen: ${new Date(subject.examDate).toLocaleDateString()}</span>` : ''}
                            </div>
                            <h3 class="text-xl font-bold mt-3">${subject.name}</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">${subject.professor || 'Profesor'}</p>
                        </div>
                        <div class="mt-6">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-sm font-medium">Progreso</span>
                                <span class="text-sm font-bold text-primary">${subject.progress || 0}%</span>
                            </div>
                            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                <div class="bg-primary h-2.5 rounded-full" style="width: ${subject.progress || 0}%"></div>
                            </div>
                        </div>
                    </div>
                `).join('')
                : `<div class="col-span-3 text-center py-12 text-slate-500">
                    <p>No tienes materias añadidas. <a href="#" onclick="app.navigateTo('explorar')" class="text-primary hover:underline">Explora materias</a></p>
                  </div>`;

            return `
                <div class="page active">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <h1 class="text-3xl font-bold">Bienvenido de nuevo, ${this.state.currentUser.name.split(' ')[0]}</h1>
                            <p class="text-slate-500 dark:text-slate-400">Aquí tienes un resumen de tu actividad.</p>
                        </div>
                        <button onclick="app.showNotifications()" class="relative p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            ${newNotifications > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">${newNotifications}</span>` : ''}
                        </button>
                    </div>
                    
                    ${alertHTML}

                    <h2 class="text-2xl font-bold mb-4">Mis Materias</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${subjectsHTML}
                    </div>
                    
                    <div class="mt-12">
                        <h2 class="text-2xl font-bold mb-4">Próximas Actividades</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="glass-effect-light p-6 rounded-2xl">
                                <h3 class="text-lg font-semibold mb-3">Simulacros Programados</h3>
                                <ul class="space-y-2">
                                    <li class="flex items-center justify-between">
                                        <span>Cálculo - Parcial 1</span>
                                        <span class="text-sm text-slate-500">Mañana, 10:00 AM</span>
                                    </li>
                                    <li class="flex items-center justify-between">
                                        <span>Álgebra Lineal - Quiz 2</span>
                                        <span class="text-sm text-slate-500">Viernes, 2:00 PM</span>
                                    </li>
                                </ul>
                            </div>
                            <div class="glass-effect-light p-6 rounded-2xl">
                                <h3 class="text-lg font-semibold mb-3">Tutorías Agendadas</h3>
                                <p class="text-slate-500 dark:text-slate-400">No tienes tutorías agendadas.</p>
                                <button onclick="app.navigateTo('tutorias')" class="mt-4 text-primary hover:underline">Buscar tutorías disponibles</button>
                            </div>
                        </div>
                    </div>

                    <div class="mt-12">
                        <h2 class="text-2xl font-bold mb-4">Logros Recientes</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${achievementsHTML}
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading student panel:', error);
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Error</h1>
                    <p class="text-red-500">No se pudieron cargar los datos del panel.</p>
                </div>
            `;
        }
    },

    async getCreatorPanelHTML() {
        try {
            // Obtener estadísticas del creador
            const resources = await this.fetchResources();
            const userResources = resources.filter(r => r.author === this.state.currentUser.name);
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Panel de Creador</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Bienvenido, ${this.state.currentUser.name}. Gestiona tus recursos y tutorías.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="glass-effect-light p-6 rounded-2xl text-center">
                            <div class="text-3xl font-bold text-primary mb-2">${userResources.length}</div>
                            <div class="text-sm text-slate-500">Recursos Publicados</div>
                        </div>
                        <div class="glass-effect-light p-6 rounded-2xl text-center">
                            <div class="text-3xl font-bold text-primary mb-2">${(userResources.reduce((acc, r) => acc + (r.rating || 0), 0) / (userResources.length || 1)).toFixed(1)}</div>
                            <div class="text-sm text-slate-500">Rating Promedio</div>
                        </div>
                        <div class="glass-effect-light p-6 rounded-2xl text-center">
                            <div class="text-3xl font-bold text-primary mb-2">${userResources.reduce((acc, r) => acc + (r.sales || 0), 0)}</div>
                            <div class="text-sm text-slate-500">Ventas Totales</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="glass-effect-light p-6 rounded-2xl">
                            <h3 class="text-xl font-semibold mb-4">Tus Recursos</h3>
                            <p class="text-slate-500 dark:text-slate-400 mb-4">Gestiona los recursos que has publicado.</p>
                            <button onclick="app.navigateTo('mis-recursos')" class="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Gestionar Recursos</button>
                        </div>
                        <div class="glass-effect-light p-6 rounded-2xl">
                            <h3 class="text-xl font-semibold mb-4">Tus Tutorías</h3>
                            <p class="text-slate-500 dark:text-slate-400 mb-4">Configura tu disponibilidad y precios para tutorías.</p>
                            <button onclick="app.navigateTo('tutorias')" class="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Gestionar Tutorías</button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading creator panel:', error);
            return '<h2>Error al cargar el panel</h2>';
        }
    },

    async getAdminPanelHTML() {
        try {
            // Obtener estadísticas generales
            const subjects = await this.fetchSubjects();
            const resources = await this.fetchResources();
            
            // En una implementación real, se obtendrían los usuarios del backend
            const userCount = 0; // Placeholder
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Panel de Administración</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Bienvenido, ${this.state.currentUser.name}. Gestiona la plataforma.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="glass-effect-light p-6 rounded-2xl text-center">
                            <div class="text-3xl font-bold text-primary mb-2">${userCount}</div>
                            <div class="text-sm text-slate-500">Usuarios Registrados</div>
                        </div>
                        <div class="glass-effect-light p-6 rounded-2xl text-center">
                            <div class="text-3xl font-bold text-primary mb-2">${subjects.length}</div>
                            <div class="text-sm text-slate-500">Materias en Catálogo</div>
                        </div>
                        <div class="glass-effect-light p-6 rounded-2xl text-center">
                            <div class="text-3xl font-bold text-primary mb-2">${resources.length}</div>
                            <div class="text-sm text-slate-500">Recursos Publicados</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="glass-effect-light p-6 rounded-2xl">
                            <h3 class="text-xl font-semibold mb-4">Gestión de Usuarios</h3>
                            <p class="text-slate-500 dark:text-slate-400 mb-4">Administra usuarios y permisos.</p>
                            <button onclick="app.navigateTo('gestion-usuarios')" class="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Gestionar Usuarios</button>
                        </div>
                        <div class="glass-effect-light p-6 rounded-2xl">
                            <h3 class="text-xl font-semibold mb-4">Gestión de Materias</h3>
                            <p class="text-slate-500 dark:text-slate-400 mb-4">Administra el catálogo de materias.</p>
                            <button onclick="app.navigateTo('gestion-materias')" class="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Gestionar Materias</button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading admin panel:', error);
            return '<h2>Error al cargar el panel</h2>';
        }
    },
    
    async getExplorarHTML() {
        try {
            const allSubjects = await this.fetchSubjects();
            const userSubjects = await this.fetchUserSubjects();
            const userSubjectIds = userSubjects.map(s => s.id);
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Explorar Materias</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-6">Busca en el catálogo y añade materias a tu panel.</p>
                    <div class="relative mb-8">
                       <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                       </svg>
                       <input type="text" id="search-materia" placeholder="Buscar materia (ej. Cálculo, Álgebra...)" class="w-full p-3 pl-12 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                    </div>
                    <div id="materias-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       ${allSubjects.map(subject => {
                           const isAdded = userSubjectIds.includes(subject.id);
                           return `
                            <div class="materia-card glass-effect-light p-6 rounded-2xl flex flex-col" data-name="${subject.name.toLowerCase()}" data-school="${(subject.school || '').toLowerCase()}">
                                <div class="flex justify-between items-start mb-2">
                                    <h3 class="text-xl font-bold">${subject.name}</h3>
                                    <span class="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full">${subject.school || 'ESCOM'}</span>
                                </div>
                                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${subject.professor || 'Profesor'}</p>
                                <div class="flex-grow"></div>
                                <div class="flex space-x-2 mt-4">
                                    <button onclick="app.showTemarioModal('${subject.id}')" class="flex-1 text-center py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-lg transition-all">Ver Temario</button>
                                    ${isAdded
                                        ? `<button class="flex-1 text-center py-2 px-4 bg-slate-200 dark:bg-slate-700 text-slate-500 font-semibold rounded-lg cursor-not-allowed" disabled>
                                            <svg xmlns="http://www.w3.org/2000/svg" class="inline-block mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Añadida
                                        </button>`
                                        : `<button onclick="app.addSubject('${subject.id}')" class="flex-1 text-center py-2 px-4 bg-secondary/80 hover:bg-secondary text-white font-semibold rounded-lg transition-all">Añadir</button>`
                                    }
                                </div>
                            </div>
                       `}).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading explorar page:', error);
            return `
                <div class="text-center py-12">
                    <p class="text-red-500">Error al cargar las materias.</p>
                </div>
            `;
        }
    },

    initExplorarListeners() {
        const searchInput = document.getElementById('search-materia');
        if (searchInput) {
            searchInput.addEventListener('keyup', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                document.querySelectorAll('.materia-card').forEach(card => {
                    const name = card.dataset.name;
                    const school = card.dataset.school;
                    if (name.includes(searchTerm) || school.includes(searchTerm)) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        }
    },

    async addSubject(subjectId) {
        try {
            this.showLoading(true);
            await apiService.addSubject(subjectId);
            this.showSuccessModal('Materia añadida', 'La materia se ha añadido correctamente a tu panel.');
            await this.renderUserSubjects();
            this.render();
        } catch (error) {
            this.showNotification('Error', 'No se pudo añadir la materia.');
        } finally {
            this.showLoading(false);
        }
    },

    async getMateriaHTML() {
        if (!this.state.currentSubject) {
            return `<p>Materia no encontrada.</p>`;
        }
        
        const subject = this.state.currentSubject;
        
        try {
            // Obtener detalles adicionales de la materia
            const userSubjects = await this.fetchUserSubjects();
            const userSubject = userSubjects.find(s => s.id === subject.id);
            
            return `
                <div class="page active">
                    <button onclick="app.navigateTo('panel')" class="flex items-center text-sm text-primary mb-4 hover:underline">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver a Mi Panel
                    </button>
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                            <h1 class="text-3xl font-bold">${subject.name}</h1>
                            <p class="text-slate-500 dark:text-slate-400">${subject.professor || 'Profesor'} | ${subject.school || 'ESCOM'}</p>
                        </div>
                        <div class="mt-4 md:mt-0">
                            <label class="text-sm text-slate-500 dark:text-slate-400 mr-2">Fecha de examen:</label>
                            <input type="date" value="${userSubject?.examDate || ''}" onchange="app.updateExamDate('${subject.id}', this.value)" class="bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-lg p-1 text-sm">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div class="lg:col-span-2">
                            <h2 class="text-2xl font-bold mb-4">Ruta de Estudio (Temario)</h2>
                            <div class="space-y-4">
                            ${subject.temario && subject.temario.length > 0 
                                ? subject.temario.map(tema => `
                                    <div class="glass-effect-light p-4 rounded-xl">
                                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                            <p class="font-semibold text-lg">${tema.title}</p>
                                            <div class="flex space-x-2 mt-3 sm:mt-0">
                                                <button onclick="app.openExternalSearch('google', '${tema.title} ${subject.name} para ingenieria')" class="p-2 rounded-full hover:bg-primary/20" title="Buscar en Google">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </button>
                                                <button onclick="app.openExternalSearch('youtube', '${tema.title} ${subject.name} tutorial')" class="p-2 rounded-full hover:bg-primary/20" title="Buscar en YouTube">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                                <button onclick="app.openExternalSearch('chatgpt', 'Explica el tema ${tema.title} de ${subject.name} para estudiantes de ingeniería con detalle, ejemplos y analogías.')" class="p-2 rounded-full hover:bg-primary/20" title="Preguntar a ChatGPT">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')
                                : `<p class="text-slate-500">No hay temario disponible para esta materia.</p>`
                            }
                            </div>
                            
                            <h2 class="text-2xl font-bold mt-8 mb-4">Práctica Enfocada</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-blue-500/10 p-4 rounded-xl">
                                    <h3 class="font-semibold">Diagnóstico con IA</h3>
                                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Ejercicios generados para medir tu conocimiento.</p>
                                    <div class="flex space-x-2">
                                        <button class="flex-1 text-xs py-2 bg-blue-500/80 text-white rounded-md hover:bg-blue-500" onclick="app.openExternalSearch('chatgpt', 'Crea un quiz de nivel básico sobre ${subject.name}')">Básico</button>
                                        <button class="flex-1 text-xs py-2 bg-blue-500/80 text-white rounded-md hover:bg-blue-500" onclick="app.openExternalSearch('chatgpt', 'Crea un quiz de nivel intermedio sobre ${subject.name}')">Intermedio</button>
                                        <button class="flex-1 text-xs py-2 bg-blue-500/80 text-white rounded-md hover:bg-blue-500" onclick="app.openExternalSearch('chatgpt', 'Crea un quiz de nivel avanzado sobre ${subject.name}')">Avanzado</button>
                                    </div>
                                </div>
                                 <div class="bg-green-500/10 p-4 rounded-xl">
                                    <h3 class="font-semibold">Simulacro de Examen</h3>
                                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Practica con un examen basado en parciales reales.</p>
                                    <button onclick="app.navigateTo('examen', {examId: 'exam01'})" class="w-full py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-md">Empezar Simulacro</button>
                                </div>
                            </div>
                        </div>
                        <div class="space-y-6">
                            <div class="glass-effect-light p-6 rounded-2xl">
                                <h3 class="text-xl font-bold mb-4">Tutoría SOS</h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">¿Atascado? Resuelve tus dudas con un monitor experto.</p>
                                <button class="w-full py-2 bg-red-500/80 hover:bg-red-500 text-white font-semibold rounded-lg" onclick="app.showTutoriaModal()">Agendar Asesoría</button>
                            </div>
                            <div class="glass-effect-light p-6 rounded-2xl">
                                <h3 class="text-xl font-bold mb-4">Tu Progreso</h3>
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-sm font-medium">Progreso General</span>
                                    <span class="text-sm font-bold text-primary">${userSubject?.progress || 0}%</span>
                                </div>
                                <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                    <div class="bg-primary h-2.5 rounded-full" style="width: ${userSubject?.progress || 0}%"></div>
                                </div>
                                <button onclick="app.navigateTo('progreso')" class="mt-4 text-sm text-primary hover:underline">Ver detalles de progreso</button>
                            </div>
                            <div class="glass-effect-light p-6 rounded-2xl">
                                <h3 class="text-xl font-bold mb-4">Foro de Discusión</h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Únete a la conversación con otros estudiantes.</p>
                                <button onclick="app.navigateTo('foro')" class="w-full py-2 bg-primary/80 hover:bg-primary text-white rounded-md">Ir al Foro</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading materia page:', error);
            return `<p>Error al cargar la materia.</p>`;
        }
    },
    
    async updateExamDate(subjectId, date) {
        try {
            await apiService.updateExamDate(subjectId, date);
            this.showSuccessModal('Fecha actualizada', 'La fecha de examen se ha actualizado correctamente.');
        } catch (error) {
            this.showNotification('Error', 'No se pudo actualizar la fecha de examen.');
        }
    },
    
    async getRecursosHTML() {
        try {
            const resources = await this.fetchResources();
            const purchasedResources = await apiService.getPurchasedResources();
            const purchasedIds = purchasedResources.map(r => r.id);
            
            return `
                <div class="page active">
                     <h1 class="text-3xl font-bold mb-2">Recursos de la Comunidad</h1>
                     <p class="text-slate-500 dark:text-slate-400 mb-8">Apuntes, guías y exámenes compartidos por otros estudiantes.</p>
                     
                     <div class="flex flex-col md:flex-row gap-4 mb-8">
                        <div class="relative flex-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" id="search-recursos" placeholder="Buscar recursos..." class="w-full p-3 pl-12 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                        </div>
                        <select id="filter-subject" class="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="all">Todas las materias</option>
                            <!-- Las opciones se llenarán dinámicamente -->
                        </select>
                        <select id="filter-type" class="p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="all">Todos los tipos</option>
                            <option value="pdf">Guías/Resúmenes</option>
                            <option value="exam">Exámenes</option>
                            <option value="formula">Formularios</option>
                        </select>
                     </div>
                     
                     <div id="recursos-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${resources.map(res => {
                            const isPurchased = purchasedIds.includes(res.id) || res.free;
                            return `
                            <div class="recurso-card glass-effect-light p-6 rounded-2xl flex flex-col" data-title="${res.title.toLowerCase()}" data-subject="${(res.subjectName || '').toLowerCase()}" data-type="${res.type}">
                                <span class="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full self-start">${res.subjectName || 'General'}</span>
                                <h3 class="text-xl font-bold mt-3">${res.title}</h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400">Por: ${res.author}</p>
                                <div class="flex items-center my-3">
                                    <div class="flex text-yellow-400">
                                        ${[...Array(5)].map((_, i) => `
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ${i < Math.round(res.rating || 0) ? 'fill-current' : ''}" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        `).join('')}
                                    </div>
                                    <span class="text-xs text-slate-500 dark:text-slate-400 ml-2">(${(res.rating || 0).toFixed(1)})</span>
                                </div>
                                <p class="text-2xl font-bold mb-4">${res.free ? 'Gratuito' : `$${res.price} <span class="text-sm font-normal text-slate-500 dark:text-slate-400">MXN</span>`}</p>
                                <div class="flex-grow"></div>
                                <div class="flex space-x-2 mt-4">
                                    <button onclick="app.showPreviewModal('${res.id}')" class="flex-1 text-center py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-lg transition-all">Vista Previa</button>
                                    ${isPurchased
                                        ? `<button onclick="app.downloadResource('${res.id}')" class="flex-1 text-center py-2 px-4 bg-slate-200 dark:bg-slate-700 text-slate-500 font-semibold rounded-lg flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            ${res.free ? 'Descargar' : 'Descargar'}
                                        </button>`
                                        : `<button onclick="app.showPaymentModal('${res.id}')" class="flex-1 text-center py-2 px-4 bg-secondary/80 hover:bg-secondary text-white font-semibold rounded-lg transition-all">Comprar</button>`
                                    }
                                </div>
                            </div>
                        `}).join('')}
                     </div>
                </div>`;
        } catch (error) {
            console.error('Error loading recursos page:', error);
            return `
                <div class="text-center py-12">
                    <p class="text-red-500">Error al cargar los recursos.</p>
                </div>
            `;
        }
    },

    initRecursosListeners() {
        const searchInput = document.getElementById('search-recursos');
        const filterSubject = document.getElementById('filter-subject');
        const filterType = document.getElementById('filter-type');
        
        if (searchInput && filterSubject && filterType) {
            const filterResources = () => {
                const searchTerm = searchInput.value.toLowerCase();
                const subjectFilter = filterSubject.value;
                const typeFilter = filterType.value;
                
                document.querySelectorAll('.recurso-card').forEach(card => {
                    const title = card.dataset.title;
                    const subject = card.dataset.subject;
                    const type = card.dataset.type;
                    
                    const matchesSearch = title.includes(searchTerm);
                    const matchesSubject = subjectFilter === 'all' || subject === subjectFilter.toLowerCase();
                    const matchesType = typeFilter === 'all' || type === typeFilter;
                    
                    if (matchesSearch && matchesSubject && matchesType) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            };
            
            searchInput.addEventListener('keyup', filterResources);
            filterSubject.addEventListener('change', filterResources);
            filterType.addEventListener('change', filterResources);
        }
    },

    async getProgresoHTML() {
        try {
            // Obtener datos de progreso del usuario
            const userSubjects = await this.fetchUserSubjects();
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Mi Progreso General</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Analiza tu evolución y áreas de mejora.</p>
                    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <div class="lg:col-span-3 glass-effect-light p-6 rounded-2xl">
                            <h3 class="font-bold mb-4">Evolución en Simulacros</h3>
                            <canvas id="line-chart"></canvas>
                        </div>
                        <div class="lg:col-span-2 glass-effect-light p-6 rounded-2xl">
                            <h3 class="font-bold mb-4">Tiempo de Estudio (Última Semana)</h3>
                            <canvas id="bar-chart"></canvas>
                        </div>
                    </div>
                    
                    <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="glass-effect-light p-6 rounded-2xl">
                            <h3 class="font-bold mb-4">Materias con Mejor Progreso</h3>
                            <ul class="space-y-3">
                                ${userSubjects
                                    .sort((a, b) => b.progress - a.progress)
                                    .slice(0, 3)
                                    .map(m => `
                                    <li class="flex items-center justify-between">
                                        <span>${m.name}</span>
                                        <span class="font-bold text-primary">${m.progress || 0}%</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        <div class="glass-effect-light p-6 rounded-2xl">
                            <h3 class="font-bold mb-4">Recomendaciones de Estudio</h3>
                            <ul class="space-y-2 list-disc list-inside">
                                <li>Practica más ejercicios de derivadas</li>
                                <li>Revisa los conceptos de espacios vectoriales</li>
                                <li>Intenta resolver exámenes pasados</li>
                            </ul>
                        </div>
                    </div>

                    <div class="mt-8 glass-effect-light p-6 rounded-2xl">
                        <h3 class="font-bold mb-4">Estadísticas de Estudio</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold text-primary">${userSubjects.length}</div>
                                <div class="text-sm text-slate-500">Materias</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-primary">0</div>
                                <div class="text-sm text-slate-500">Recursos</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-primary">0</div>
                                <div class="text-sm text-slate-500">Logros</div>
                            </div>
                            <div class="text-center">
                                <div class="text-2xl font-bold text-primary">0</div>
                                <div class="text-sm text-slate-500">Horas estudiadas</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading progreso page:', error);
            return `<p>Error al cargar el progreso.</p>`;
        }
    },
    
    renderProgreso() {
        // Implementación básica de gráficos
        const isDark = this.state.theme === 'dark';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#e2e8f0' : '#334155';
        
        // Line Chart
        const lineCtx = document.getElementById('line-chart');
        if (lineCtx) {
            new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: ['Sim 1', 'Sim 2', 'Sim 3'],
                    datasets: [{
                        label: 'Puntaje',
                        data: [55, 62, 75],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.2)',
                        fill: true,
                        tension: 0.3,
                    },{
                        label: 'Aprobatorio',
                        data: [60, 60, 60],
                        borderColor: '#f59e0b',
                        borderDash: [5, 5],
                        fill: false,
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: textColor } } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            max: 100, 
                            ticks: { color: textColor }, 
                            grid: { color: gridColor } 
                        },
                        x: { 
                            ticks: { color: textColor }, 
                            grid: { color: gridColor } 
                        }
                    }
                }
            });
        }

        // Bar Chart
        const barCtx = document.getElementById('bar-chart');
        if (barCtx) {
            new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
                    datasets: [{
                        label: 'Minutos',
                        data: [45, 60, 25, 90, 30],
                        backgroundColor: '#10b981',
                        borderRadius: 5,
                    }]
                },
                 options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            ticks: { color: textColor }, 
                            grid: { color: gridColor } 
                        },
                        x: { 
                            ticks: { color: textColor }, 
                            grid: { color: gridColor } 
                        }
                    }
                }
            });
        }
    },

    async getExamenHTML() {
        if (!this.state.currentExam) {
            return `<p>Examen no encontrado.</p>`;
        }
        
        const exam = this.state.currentExam;
        
        return `
            <div class="page active">
                <div class="flex justify-between items-center mb-4">
                     <button onclick="app.navigateTo('materia', {subjectId: '${exam.subjectId}'})" class="flex items-center text-sm text-primary hover:underline">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver a la materia
                     </button>
                     <div class="text-2xl font-mono bg-red-500/20 text-red-500 py-2 px-4 rounded-lg">
                         <svg xmlns="http://www.w3.org/2000/svg" class="inline-block h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <span id="exam-timer">60:00</span>
                     </div>
                </div>
                <h1 class="text-3xl font-bold">${exam.title}</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">Resuelve los ejercicios en el tiempo establecido.</p>

                <div id="exam-questions-container">
                    ${exam.questions ? exam.questions.map((q, index) => `
                        <div class="glass-effect-light p-6 rounded-2xl mb-6 question-card" id="q-card-${q.id}">
                            <p class="font-semibold mb-4">Pregunta ${index + 1}/${exam.questions.length}</p>
                            <div class="text-lg mb-4">${q.text}</div>
                            <div class="flex flex-col">
                                <label for="answer-${q.id}" class="text-sm text-slate-500 dark:text-slate-400 mb-2">Escribe tu respuesta:</label>
                                <math-field id="math-field-${q.id}" class="math-field" placeholder="Escribe tu respuesta aquí..." onfocus="app.setActiveMathField('math-field-${q.id}', '${q.id}')"></math-field>
                            </div>
                            <div class="mt-4 flex justify-between items-center">
                                <div id="preview-${q.id}" class="p-3 bg-slate-200 dark:bg-slate-900 rounded-xl min-h-[50px] flex items-center"></div>
                                <button onclick="app.checkAnswer('${q.id}')" class="py-2 px-4 bg-primary/80 hover:bg-primary text-white rounded-md">Revisar</button>
                            </div>
                            <div id="feedback-${q.id}" class="mt-4 hidden"></div>
                        </div>
                    `).join('') : '<p>No hay preguntas disponibles para este examen.</p>'}
                </div>
                
                <div class="mt-8 text-center">
                    <button onclick="app.finishExam()" class="py-3 px-8 bg-secondary/80 hover:bg-secondary text-white font-bold rounded-lg transition-transform transform hover:scale-105">Terminar y Calificar Examen</button>
                </div>
            </div>
        `;
    },
    
    initExamen() {
        // Inicializar temporizador y estado del examen
        this.examState = {
            timerId: null,
            timeLeft: this.state.currentExam?.duration || 3600,
            answers: {},
            activeInput: null,
        };

        this.startTimer();
        
        // Inicializar MathLive si está disponible
        if (typeof mathVirtualKeyboard !== 'undefined') {
            mathVirtualKeyboard.show();
        }
    },

    setActiveMathField(fieldId, questionId) {
        this.state.activeMathField = fieldId;
        this.state.activeQuestionId = questionId;
    },

    startTimer() {
        const timerEl = document.getElementById('exam-timer');
        if (!timerEl) return;
        
        this.examState.timerId = setInterval(() => {
            this.examState.timeLeft--;
            const minutes = Math.floor(this.examState.timeLeft / 60);
            const seconds = this.examState.timeLeft % 60;
            timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (this.examState.timeLeft <= 0) {
                clearInterval(this.examState.timerId);
                this.finishExam();
            }
        }, 1000);
    },
    
    checkAnswer(questionId) {
        // Implementar lógica de verificación de respuesta
        this.showNotification('Revisión', 'Funcionalidad en desarrollo');
    },

    async finishExam() {
        if (this.examState.timerId) {
            clearInterval(this.examState.timerId);
        }
        
        try {
            // Enviar respuestas al backend
            await apiService.submitExam(this.state.currentExam.id, this.examState.answers);
            this.showExamResultsModal(85, 3, 4); // Valores de ejemplo
        } catch (error) {
            this.showNotification('Error', 'No se pudo enviar el examen.');
        }
    },

    showExamResultsModal(score, correct, total) {
        const modalHTML = `
        <div id="exam-results-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 text-center transform transition-all scale-95 opacity-0 animate-modal-in">
                <h2 class="text-2xl font-bold mb-2">Resultados del Examen</h2>
                <div class="text-5xl font-bold my-6 ${score >= 60 ? 'text-green-500' : 'text-red-500'}">${score}%</div>
                <p class="text-lg mb-4">${correct} de ${total} respuestas correctas</p>
                <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 my-6">
                    <div class="h-2.5 rounded-full ${score >= 60 ? 'bg-green-500' : 'bg-red-500'}" style="width: ${score}%"></div>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    ${score >= 60 ? '¡Felicidades! Has aprobado el examen.' : 'Necesitas estudiar más este tema.'}
                </p>
                <div class="flex space-x-4">
                    <button onclick="app.closeModal('exam-results-modal')" class="flex-1 py-2 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg transition-colors">Cerrar</button>
                    <button onclick="app.reviewExam()" class="flex-1 py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-lg transition-colors">Revisar Respuestas</button>
                </div>
            </div>
        </div>`;
        
        this.dom.modalsContainer.innerHTML = modalHTML;
    },
    
    reviewExam() {
        this.closeModal('exam-results-modal');
    },

    async getSimuladorHTML() {
        if (!this.state.currentSubject) {
            return `<p>Materia no encontrada.</p>`;
        }
        
        const subject = this.state.currentSubject;
        
        return `
            <div class="page active">
                <button onclick="app.navigateTo('materia', {subjectId: '${subject.id}'})" class="flex items-center text-sm text-primary mb-4 hover:underline">
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver a ${subject.name}
                </button>
                <h1 class="text-3xl font-bold mb-2">Simulador de Exámenes</h1>
                <p class="text-slate-500 dark:text-slate-400 mb-8">Practica con preguntas del banco de reactivos para ${subject.name}.</p>
                
                <div class="glass-effect-light p-6 rounded-2xl mb-8">
                    <h2 class="text-xl font-bold mb-4">Configura tu examen</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Número de preguntas</label>
                            <input type="number" id="question-count" min="1" max="20" value="5" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Dificultad</label>
                            <select id="difficulty" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                                <option value="all">Todas</option>
                                <option value="Fácil">Fácil</option>
                                <option value="Intermedio">Intermedio</option>
                                <option value="Avanzado">Avanzado</option>
                            </select>
                        </div>
                    </div>
                    <button onclick="app.generateExam()" class="mt-6 w-full py-3 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition-transform transform hover:scale-105">Generar Examen</button>
                </div>
                
                <div id="simulador-results" class="hidden">
                    <!-- Generated exam will appear here -->
                </div>
            </div>
        `;
    },
    
    initSimulador() {
        // Inicialización del simulador
    },
    
    generateExam() {
        // Generar examen dinámico
        this.showNotification('Simulador', 'Funcionalidad en desarrollo');
    },
    
    async getForoHTML() {
        try {
            const forums = await this.fetchForums();
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Foro de Ayuda</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Comparte dudas y soluciones con otros estudiantes.</p>
                    
                    <div class="glass-effect-light p-6 rounded-2xl mb-8">
                        <h2 class="text-xl font-bold mb-4">Temas de Discusión</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${forums.map(forum => `
                                <div class="forum-post p-4 rounded-xl cursor-pointer hover:bg-primary/5" onclick="app.navigateTo('foro-tema', {forumId: '${forum.id}'})">
                                    <h3 class="font-semibold">${forum.title}</h3>
                                    <p class="text-sm text-slate-500 dark:text-slate-400">${forum.subjectName || 'General'} • ${forum.postCount || 0} respuestas</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="glass-effect-light p-6 rounded-2xl">
                        <h2 class="text-xl font-bold mb-4">Crear Nuevo Tema</h2>
                        <form id="new-forum-form">
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Título</label>
                                <input type="text" id="forum-title" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" placeholder="¿Cuál es tu pregunta?" required>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Materia</label>
                                <select id="forum-subject" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" required>
                                    <option value="">Selecciona una materia</option>
                                    <!-- Las opciones se llenarán dinámicamente -->
                                </select>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Pregunta</label>
                                <textarea id="forum-content" rows="4" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Describe tu duda con detalle..." required></textarea>
                            </div>
                            <button type="submit" class="w-full py-3 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition-transform transform hover:scale-105">Publicar Pregunta</button>
                        </form>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading foro page:', error);
            return `<p>Error al cargar el foro.</p>`;
        }
    },
    
    initForoListeners() {
        const form = document.getElementById('new-forum-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = document.getElementById('forum-title').value;
                const subjectId = document.getElementById('forum-subject').value;
                const content = document.getElementById('forum-content').value;
                
                if (title && subjectId && content) {
                    try {
                        await apiService.createForumTopic({
                            title,
                            subjectId,
                            content,
                            author: this.state.currentUser.name
                        });
                        this.showSuccessModal('Tema creado', 'Tu pregunta ha sido publicada en el foro.');
                        form.reset();
                    } catch (error) {
                        this.showNotification('Error', 'No se pudo crear el tema.');
                    }
                }
            });
        }
    },
    
    async getFormulariosHTML() {
        try {
            // Obtener formularios del backend
            const formularios = []; // Placeholder
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Formularios Matemáticos</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Colección de formularios para consulta rápida.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${formularios.map(form => `
                            <div class="glass-effect-light p-6 rounded-2xl flex flex-col">
                                <span class="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full self-start mb-3">${form.subjectName || 'General'}</span>
                                <h3 class="text-xl font-bold mb-3">${form.title}</h3>
                                <div class="flex-grow"></div>
                                <button onclick="app.showPdfModal('${form.fileUrl}', '${form.title}')" class="w-full py-2 bg-primary/80 hover:bg-primary text-white rounded-md">Ver Formulario</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading formularios page:', error);
            return `<p>Error al cargar los formularios.</p>`;
        }
    },
    
    async getLogrosHTML() {
        try {
            const achievements = await apiService.getUserAchievements();
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Mis Logros</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Recompensas por tu progreso y participación.</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${achievements.map(achievement => `
                            <div class="glass-effect-light p-6 rounded-2xl text-center achievement-unlocked">
                                <div class="text-4xl mb-3">${achievement.icon || '🏆'}</div>
                                <h3 class="text-lg font-semibold mb-1">${achievement.name}</h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">${achievement.description}</p>
                                <p class="text-xs text-slate-400">Obtenido: ${achievement.date}</p>
                            </div>
                        `).join('')}
                        
                        ${[...Array(6 - achievements.length)].map((_, i) => `
                            <div class="glass-effect-light p-6 rounded-2xl text-center opacity-60">
                                <div class="text-4xl mb-3">🔒</div>
                                <h3 class="text-lg font-semibold mb-1">Logro Bloqueado</h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400">Sigue usando la plataforma para desbloquear este logro.</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading logros page:', error);
            return `<p>Error al cargar los logros.</p>`;
        }
    },
    
    async getMisRecursosHTML() {
        if (this.state.currentUser.role !== 'creador') {
            return `<p class="text-center py-8">No tienes permisos para acceder a esta sección.</p>`;
        }
        
        try {
            const resources = await this.fetchResources();
            const myResources = resources.filter(r => r.author === this.state.currentUser.name);
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Mis Recursos</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Gestiona los recursos que has publicado.</p>
                    
                    <button onclick="app.showNewResourceModal()" class="mb-6 py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-md flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Crear Nuevo Recurso
                    </button>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${myResources.map(res => {
                            return `
                                <div class="glass-effect-light p-6 rounded-2xl flex flex-col">
                                    <span class="text-xs font-semibold bg-primary/20 text-primary py-1 px-2 rounded-full self-start">${res.subjectName || 'General'}</span>
                                    <h3 class="text-xl font-bold mt-3">${res.title}</h3>
                                    <div class="flex items-center my-3">
                                        <div class="flex text-yellow-400">
                                            ${[...Array(5)].map((_, i) => `
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ${i < Math.round(res.rating || 0) ? 'fill-current' : ''}" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            `).join('')}
                                        </div>
                                        <span class="text-xs text-slate-500 dark:text-slate-400 ml-2">(${(res.rating || 0).toFixed(1)})</span>
                                    </div>
                                    <p class="text-sm text-slate-500 dark:text-slate-400">${res.sales || 0} ventas • ${res.commentCount || 0} reseñas</p>
                                    <div class="flex space-x-2 mt-4">
                                        <button onclick="app.showEditResourceModal('${res.id}')" class="flex-1 py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-md">Editar</button>
                                        <button onclick="app.deleteResource('${res.id}')" class="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-md">Eliminar</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        
                        ${myResources.length === 0 ? `
                            <div class="col-span-3 text-center py-12 text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p>Aún no has publicado ningún recurso.</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading mis-recursos page:', error);
            return `<p>Error al cargar los recursos.</p>`;
        }
    },
    
    async getTutoriasHTML() {
        if (this.state.currentUser.role !== 'creador') {
            try {
                const tutors = await this.fetchTutors();
                
                return `
                    <div class="page active">
                        <h1 class="text-3xl font-bold mb-2">Tutorías Disponibles</h1>
                        <p class="text-slate-500 dark:text-slate-400 mb-8">Conecta con tutores expertos en cada materia.</p>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            ${tutors.map(tutor => `
                                <div class="glass-effect-light p-6 rounded-2xl flex flex-col">
                                    <div class="flex items-center mb-4">
                                        <div class="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-lg mr-3">${tutor.name.split(' ').map(n => n[0]).join('')}</div>
                                        <div>
                                            <h3 class="font-semibold">${tutor.name}</h3>
                                            <div class="flex items-center">
                                                <div class="flex text-yellow-400">
                                                    ${[...Array(5)].map((_, i) => `
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ${i < Math.round(tutor.rating || 0) ? 'fill-current' : ''}" viewBox="0 0 20 20" fill="currentColor">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    `).join('')}
                                                </div>
                                                <span class="text-xs text-slate-500 dark:text-slate-400 ml-2">(${(tutor.rating || 0).toFixed(1)})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${tutor.bio || 'Tutor experto'}</p>
                                    <p class="text-sm mb-2"><strong>Especialidad:</strong> ${tutor.specialties || 'Matemáticas'}</p>
                                    <p class="text-sm mb-4"><strong>Tarifas:</strong> $${tutor.rate30min || 150} (30min) / $${tutor.rate60min || 250} (60min)</p>
                                    <button onclick="app.showTutoriaModal('${tutor.id}')" class="w-full py-2 bg-primary/80 hover:bg-primary text-white rounded-md">Agendar Tutoría</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error loading tutorias page:', error);
                return `<p>Error al cargar las tutorías.</p>`;
            }
        } else {
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Mis Tutorías</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Configura tu disponibilidad y tarifas como tutor.</p>
                    
                    <div class="glass-effect-light p-6 rounded-2xl mb-8">
                        <h2 class="text-xl font-bold mb-4">Configuración de Tutorías</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Tarifa 30 minutos (MXN)</label>
                                <input type="number" id="rate-30min" value="150" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Tarifa 60 minutos (MXN)</label>
                                <input type="number" id="rate-60min" value="250" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            </div>
                        </div>
                        <button onclick="app.updateTutoringRates()" class="py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-md">Actualizar Tarifas</button>
                    </div>
                    
                    <div class="glass-effect-light p-6 rounded-2xl">
                        <h2 class="text-xl font-bold mb-4">Disponibilidad Semanal</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <!-- Disponibilidad se cargará dinámicamente -->
                        </div>
                    </div>
                </div>
            `;
        }
    },
    
    async getGestionUsuariosHTML() {
        if (this.state.currentUser.role !== 'admin') {
            return `<p class="text-center py-8">No tienes permisos para acceder a esta sección.</p>`;
        }
        
        try {
            const users = await apiService.getAllUsers();
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Administra los usuarios registrados en la plataforma.</p>
                    
                    <div class="glass-effect-light p-6 rounded-2xl overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-light-border dark:border-dark-border">
                                    <th class="text-left py-2">Nombre</th>
                                    <th class="text-left py-2">Email</th>
                                    <th class="text-left py-2">Rol</th>
                                    <th class="text-left py-2">Estado</th>
                                    <th class="text-left py-2">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(user => `
                                    <tr class="border-b border-light-border dark:border-dark-border">
                                        <td class="py-3">${user.name}</td>
                                        <td class="py-3">${user.email}</td>
                                        <td class="py-3">
                                            <span class="bg-primary/20 text-primary text-xs py-1 px-2 rounded-full">${user.role}</span>
                                        </td>
                                        <td class="py-3">
                                            <span class="bg-${user.verified ? 'green' : 'yellow'}-500/20 text-${user.verified ? 'green' : 'yellow'}-500 text-xs py-1 px-2 rounded-full">
                                                ${user.verified ? 'Verificado' : 'Pendiente'}
                                            </span>
                                        </td>
                                        <td class="py-3">
                                            <button onclick="app.editUser('${user.id}')" class="text-blue-500 hover:text-blue-700 mr-2">Editar</button>
                                            <button onclick="app.deleteUser('${user.id}')" class="text-red-500 hover:text-red-700">Eliminar</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading gestion-usuarios page:', error);
            return `<p>Error al cargar los usuarios.</p>`;
        }
    },
    
    async getGestionMateriasHTML() {
        if (this.state.currentUser.role !== 'admin') {
            return `<p class="text-center py-8">No tienes permisos para acceder a esta sección.</p>`;
        }
        
        try {
            const subjects = await this.fetchSubjects();
            
            return `
                <div class="page active">
                    <h1 class="text-3xl font-bold mb-2">Gestión de Materias</h1>
                    <p class="text-slate-500 dark:text-slate-400 mb-8">Administra el catálogo de materias disponibles.</p>
                    
                    <button onclick="app.showNewSubjectModal()" class="mb-6 py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-md flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Agregar Nueva Materia
                    </button>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${subjects.map(subject => `
                            <div class="glass-effect-light p-6 rounded-2xl flex flex-col">
                                <h3 class="text-xl font-bold mb-2">${subject.name}</h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">${subject.professor || 'Profesor'} | ${subject.school || 'ESCOM'}</p>
                                <div class="flex space-x-2 mt-auto">
                                    <button onclick="app.editSubject('${subject.id}')" class="flex-1 py-2 px-4 bg-primary/20 hover:bg-primary/30 text-primary rounded-md">Editar</button>
                                    <button onclick="app.deleteSubject('${subject.id}')" class="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-md">Eliminar</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading gestion-materias page:', error);
            return `<p>Error al cargar las materias.</p>`;
        }
    },
    
    // --- MODAL FUNCTIONS ---
    showSuccessModal(title, message) {
        const modalHTML = `
        <div id="success-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 text-center transform transition-all scale-95 opacity-0 animate-modal-in">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 class="text-xl font-bold mb-2">${title}</h3>
                <p class="text-slate-500 dark:text-slate-400 mb-6">${message}</p>
                <button onclick="app.closeModal('success-modal')" class="w-full py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-lg transition-colors">Aceptar</button>
            </div>
        </div>`;
        
        this.dom.modalsContainer.innerHTML = modalHTML;
    },
    
    showTemarioModal(subjectId) {
        // Obtener temario del backend
        const subject = this.state.cache.subjects?.find(s => s.id === subjectId);
        
        if (!subject) {
            this.showNotification('Error', 'No se encontró el temario.');
            return;
        }
        
        const modalHTML = `
        <div id="temario-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-2xl rounded-2xl p-8 transform transition-all scale-95 opacity-0 animate-modal-in max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold">Temario de ${subject.name}</h3>
                    <button onclick="app.closeModal('temario-modal')" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div class="space-y-4">
                    ${subject.temario && subject.temario.length > 0 
                        ? subject.temario.map(tema => `
                            <div class="p-4 border border-light-border dark:border-dark-border rounded-xl">
                                <h4 class="font-semibold">${tema.title}</h4>
                            </div>
                        `).join('')
                        : '<p class="text-slate-500">No hay temario disponible.</p>'
                    }
                </div>
            </div>
        </div>`;
        
        this.dom.modalsContainer.innerHTML = modalHTML;
    },
    
    async showPreviewModal(resourceId) {
        try {
            const resources = await this.fetchResources();
            const resource = resources.find(r => r.id === resourceId);
            
            if (!resource) {
                this.showNotification('Error', 'Recurso no encontrado.');
                return;
            }
            
            const modalHTML = `
            <div id="preview-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div class="bg-light-card dark:bg-dark-card w-full max-w-4xl rounded-2xl transform transition-all scale-95 opacity-0 animate-modal-in max-h-[80vh] overflow-hidden">
                    <div class="flex justify-between items-center p-6 border-b border-light-border dark:border-dark-border">
                        <h3 class="text-xl font-bold">Vista Previa: ${resource.title}</h3>
                        <button onclick="app.closeModal('preview-modal')" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div class="p-6">
                        <div class="pdf-viewer" id="pdf-preview">
                            <div class="text-center py-12">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p class="text-slate-500 dark:text-slate-400">Vista previa del recurso</p>
                                <button onclick="app.downloadResource('${resource.id}')" class="mt-4 py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-md">${resource.free ? 'Descargar Completo' : 'Comprar para Descargar'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            
            this.dom.modalsContainer.innerHTML = modalHTML;
        } catch (error) {
            console.error('Error showing preview:', error);
            this.showNotification('Error', 'No se pudo cargar la vista previa.');
        }
    },
    
    showPaymentModal(resourceId) {
        const modalHTML = `
        <div id="payment-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 transform transition-all scale-95 opacity-0 animate-modal-in">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">Comprar Recurso</h3>
                    <button onclick="app.closeModal('payment-modal')" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div class="mb-6">
                    <h4 class="font-semibold mb-2" id="resource-title">Cargando...</h4>
                    <p class="text-2xl font-bold text-primary" id="resource-price">$0</p>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Método de Pago</label>
                        <select class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            <option>Tarjeta de Crédito/Débito</option>
                            <option>PayPal</option>
                            <option>Transferencia Bancaria</option>
                        </select>
                    </div>
                    <button onclick="app.purchaseResource('${resourceId}')" class="w-full py-3 bg-secondary/80 hover:bg-secondary text-white font-bold rounded-lg transition-transform transform hover:scale-105">Pagar Ahora</button>
                </div>
            </div>
        </div>`;
        
        this.dom.modalsContainer.innerHTML = modalHTML;
        
        // Cargar detalles del recurso
        this.loadResourceDetails(resourceId);
    },
    
    async loadResourceDetails(resourceId) {
        try {
            const resources = await this.fetchResources();
            const resource = resources.find(r => r.id === resourceId);
            
            if (resource) {
                document.getElementById('resource-title').textContent = resource.title;
                document.getElementById('resource-price').innerHTML = `$${resource.price} <span class="text-sm font-normal text-slate-500 dark:text-slate-400">MXN</span>`;
            }
        } catch (error) {
            console.error('Error loading resource details:', error);
        }
    },
    
    showTutoriaModal(tutorId = null) {
        const modalHTML = `
        <div id="tutoria-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 transform transition-all scale-95 opacity-0 animate-modal-in">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">${tutorId ? 'Agendar Tutoría' : 'Solicitar Tutoría SOS'}</h3>
                    <button onclick="app.closeModal('tutoria-modal')" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Materia</label>
                        <select class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" id="tutoria-subject">
                            <!-- Se llenará dinámicamente -->
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Tema específico</label>
                        <input type="text" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Ej: Derivadas, Integrales, etc.">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Duración</label>
                        <select class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="30">30 minutos ($150)</option>
                            <option value="60">60 minutos ($250)</option>
                        </select>
                    </div>
                    <button onclick="app.scheduleTutoring()" class="w-full py-3 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition-transform transform hover:scale-105">Solicitar Tutoría</button>
                </div>
            </div>
        </div>`;
        
        this.dom.modalsContainer.innerHTML = modalHTML;
    },
    
    showPdfModal(fileUrl, title) {
        const modalHTML = `
        <div id="pdf-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-4xl rounded-2xl transform transition-all scale-95 opacity-0 animate-modal-in max-h-[80vh] overflow-hidden">
                <div class="flex justify-between items-center p-6 border-b border-light-border dark:border-dark-border">
                    <h3 class="text-xl font-bold">${title}</h3>
                    <button onclick="app.closeModal('pdf-modal')" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div class="p-6">
                    <div class="pdf-viewer" id="pdf-full">
                        <div class="text-center py-12">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p class="text-slate-500 dark:text-slate-400">Vista del formulario completo</p>
                            <button onclick="app.downloadPdf('${fileUrl}', '${title}')" class="mt-4 py-2 px-4 bg-primary hover:bg-primary-focus text-white rounded-md">Descargar PDF</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
        
        this.dom.modalsContainer.innerHTML = modalHTML;
    },
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    },
    
    // --- ACTION FUNCTIONS ---
    async downloadResource(resourceId) {
        try {
            await apiService.downloadResource(resourceId);
            this.showSuccessModal('Descarga iniciada', 'El recurso se está descargando.');
        } catch (error) {
            this.showNotification('Error', 'No se pudo descargar el recurso.');
        }
    },
    
    async purchaseResource(resourceId) {
        try {
            await apiService.purchaseResource(resourceId);
            this.closeModal('payment-modal');
            this.showSuccessModal('Compra exitosa', 'El recurso se ha añadido a tu biblioteca.');
            this.render();
        } catch (error) {
            this.showNotification('Error', 'No se pudo completar la compra.');
        }
    },
    
    async scheduleTutoring() {
        try {
            // Implementar lógica de agendamiento
            this.closeModal('tutoria-modal');
            this.showSuccessModal('Tutoría agendada', 'Un tutor se pondrá en contacto contigo pronto.');
        } catch (error) {
            this.showNotification('Error', 'No se pudo agendar la tutoría.');
        }
    },
    
    async updateTutoringRates() {
        try {
            // Implementar actualización de tarifas
            this.showSuccessModal('Tarifas actualizadas', 'Tus tarifas se han actualizado correctamente.');
        } catch (error) {
            this.showNotification('Error', 'No se pudieron actualizar las tarifas.');
        }
    },
    
    editAvailability(day) {
        this.showSuccessModal('Disponibilidad', `Editando disponibilidad para ${day}`);
    },
    
    downloadPdf(fileUrl, title) {
        this.showSuccessModal('Descarga iniciada', `El formulario "${title}" se está descargando.`);
    },
    
    showNewResourceModal() {
        const modalHTML = `
        <div id="new-resource-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 transform transition-all scale-95 opacity-0 animate-modal-in">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">Crear Nuevo Recurso</h3>
                    <button onclick="app.closeModal('new-resource-modal')" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Título</label>
                        <input type="text" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Ej: Guía de Examen Final">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Materia</label>
                        <select class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            <!-- Se llenará dinámicamente -->
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Tipo</label>
                        <select class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none">
                            <option value="pdf">Guía/Resumen</option>
                            <option value="exam">Examen</option>
                            <option value="formula">Formulario</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Precio (MXN)</label>
                        <input type="number" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" placeholder="0 para gratuito">
                    </div>
                    <button onclick="app.createNewResource()" class="w-full py-3 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition-transform transform hover:scale-105">Publicar Recurso</button>
                </div>
            </div>
        </div>`;
        
        this.dom.modalsContainer.innerHTML = modalHTML;
    },
    
    async createNewResource() {
        try {
            // Implementar creación de recurso
            this.closeModal('new-resource-modal');
            this.showSuccessModal('Recurso creado', 'Tu recurso ha sido publicado exitosamente.');
        } catch (error) {
            this.showNotification('Error', 'No se pudo crear el recurso.');
        }
    },
    
    editResource(resourceId) {
        this.showSuccessModal('Editar recurso', `Editando recurso con ID: ${resourceId}`);
    },
    
    async deleteResource(resourceId) {
        if (confirm('¿Estás seguro de que quieres eliminar este recurso?')) {
            try {
                // Implementar eliminación
                this.showSuccessModal('Recurso eliminado', 'El recurso ha sido eliminado correctamente.');
            } catch (error) {
                this.showNotification('Error', 'No se pudo eliminar el recurso.');
            }
        }
    },
    
    editUser(userId) {
        this.showSuccessModal('Editar usuario', `Editando usuario con ID: ${userId}`);
    },
    
    async deleteUser(userId) {
        if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
            try {
                await apiService.manageUser(userId, 'delete');
                this.showSuccessModal('Usuario eliminado', 'El usuario ha sido eliminado correctamente.');
                this.render();
            } catch (error) {
                this.showNotification('Error', 'No se pudo eliminar el usuario.');
            }
        }
    },
    
    showNewSubjectModal() {
        const modalHTML = `
        <div id="new-subject-modal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div class="bg-light-card dark:bg-dark-card w-full max-w-md rounded-2xl p-8 transform transition-all scale-95 opacity-0 animate-modal-in">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold">Agregar Nueva Materia</h3>
                    <button onclick="app.closeModal('new-subject-modal')" class="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Nombre</label>
                        <input type="text" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Ej: Cálculo Diferencial">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Profesor</label>
                        <input type="text" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Nombre del profesor">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Escuela</label>
                        <input type="text" class="w-full p-3 bg-white/80 dark:bg-slate-800/50 border border-light-border dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Ej: ESCOM, UPIITA, etc.">
                    </div>
                    <button onclick="app.createNewSubject()" class="w-full py-3 bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition-transform transform hover:scale-105">Agregar Materia</button>
                </div>
            </div>
        </div>`;
        
        this.dom.modalsContainer.innerHTML = modalHTML;
    },
    
    async createNewSubject() {
        try {
            await apiService.createSubject({
                name: document.querySelector('#new-subject-modal input[type="text"]').value,
                professor: document.querySelectorAll('#new-subject-modal input[type="text"]')[1].value,
                school: document.querySelectorAll('#new-subject-modal input[type="text"]')[2].value
            });
            this.closeModal('new-subject-modal');
            this.showSuccessModal('Materia agregada', 'La nueva materia ha sido agregada al catálogo.');
            this.fetchSubjects(true); // Refrescar cache
        } catch (error) {
            this.showNotification('Error', 'No se pudo crear la materia.');
        }
    },
    
    editSubject(subjectId) {
        this.showSuccessModal('Editar materia', `Editando materia con ID: ${subjectId}`);
    },
    
    async deleteSubject(subjectId) {
        if (confirm('¿Estás seguro de que quieres eliminar esta materia?')) {
            try {
                await apiService.deleteSubject(subjectId);
                this.showSuccessModal('Materia eliminada', 'La materia ha sido eliminada correctamente.');
                this.fetchSubjects(true); // Refrescar cache
            } catch (error) {
                this.showNotification('Error', 'No se pudo eliminar la materia.');
            }
        }
    },
    
    // --- UTILITY FUNCTIONS ---
    openExternalSearch(service, query) {
        let url;
        switch(service) {
            case 'google':
                url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
                break;
            case 'youtube':
                url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
                break;
            case 'wolfram':
                url = `https://www.wolframalpha.com/input?i=${encodeURIComponent(query)}`;
                break;
            case 'chatgpt':
                this.showNotification('Prompt para ChatGPT', `Copia y pega este prompt en ChatGPT:\n\n"${query}"`);
                return;
            default:
                return;
        }
        window.open(url, '_blank');
    },
    
    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.className = 'glass-effect-light p-4 rounded-xl mb-4';
        notification.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold">${title}</h4>
                    <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">${message}</p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        `;
        
        this.dom.notificationsContainer.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    showNotifications() {
        this.showNotification('Notificaciones', 'Funcionalidad en desarrollo');
    },

    showLoading(show) {
        this.state.isLoading = show;
        if (show) {
            document.body.classList.add('loading');
        } else {
            document.body.classList.remove('loading');
        }
    },

    async refreshCache() {
        try {
            await Promise.all([
                this.fetchSubjects(true),
                this.fetchResources(true),
                this.fetchExams(true),
                this.fetchTutors(true),
                this.fetchForums(true)
            ]);
            this.showNotification('Cache actualizado', 'Los datos se han actualizado correctamente.');
        } catch (error) {
            console.error('Error refreshing cache:', error);
        }
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});