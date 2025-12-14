import { API_CONFIG, HARDCODED_DATA, DEMO_PROFILES } from './constants.js';

const DEMO_STORAGE_KEY = 'estudia-pro-demo-mode';
const DEMO_LATENCY = 350;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const DemoModeController = (() => {
  let enabled = true;
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored !== null) {
      enabled = stored === 'true';
    }
  } catch {
    enabled = true;
  }
  return {
    isEnabled: () => enabled,
    setEnabled: (flag) => {
      enabled = Boolean(flag);
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, enabled);
      } catch {
        /* ignore */
      }
    },
    toggle: () => {
      DemoModeController.setEnabled(!enabled);
      return enabled;
    }
  };
})();

export const isDemoMode = () => DemoModeController.isEnabled();
export const setDemoMode = (flag) => DemoModeController.setEnabled(flag);
export const toggleDemoMode = () => DemoModeController.toggle();

export const formatUserForFrontend = (rawUser) => {
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
  currentUser: DEMO_PROFILES.estudiante,
  upcomingActivities: deepClone(HARDCODED_DATA.activities.upcoming || []),
  async simulateLatency() {
    return new Promise((resolve) => setTimeout(resolve, DEMO_LATENCY));
  },
  normalize(text) {
    return (text || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },
  nextId(prefix) {
    return `${prefix}-${Date.now()}`;
  },
  getCurrentUser() {
    if (!this.currentUser) {
      this.currentUser = DEMO_PROFILES.estudiante;
    }
    return this.currentUser;
  },
  getUserPurchases() {
    const user = this.getCurrentUser();
    if (!Array.isArray(user.purchasedResources)) {
      user.purchasedResources = [...HARDCODED_DATA.purchasedResourceIds];
    }
    return user.purchasedResources;
  },
  async handle(endpoint, method, data) {
    await this.simulateLatency();
    const loggedUser = this.getCurrentUser();
    const demoUsers = HARDCODED_DATA.demoUsersList;

    if (endpoint === API_CONFIG.ENDPOINTS.AUTH.LOGIN && method === 'POST') {
      const identifier = (data?.email || data?.username || '').toString().toLowerCase().trim();

      const profile = demoUsers.find((user) => {
        const u = (user.username || '').toString().toLowerCase().trim();
        const e = (user.email || '').toString().toLowerCase().trim();
        return u === identifier || (e && e === identifier);
      });

      if (profile && (profile.password || 'demo123') === data?.password) {
        this.currentUser = profile;
        localStorage.setItem('authToken', 'demo-token');
        return { success: true, token: 'demo-token', user: formatUserForFrontend(profile) };
      }
      return { success: false, message: 'Credenciales inválidas (demo@estudiapro.com / demo123)' };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.AUTH.REGISTER && method === 'POST') {
      return { success: true, message: 'Registro simulado. Inicia sesión con demo@estudiapro.com / demo123' };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.AUTH.LOGOUT) {
      localStorage.removeItem('authToken');
      this.currentUser = DEMO_PROFILES.estudiante;
      return { success: true };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.USERS.GET_PROFILE) {
      const token = localStorage.getItem('authToken');
      if (token !== 'demo-token') throw new Error('Sesión expirada en modo demo');
      return formatUserForFrontend(loggedUser);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.USERS.GET_DASHBOARD) {
      // Simulate dashboard data
      return {
        usuario: formatUserForFrontend(loggedUser),
        mis_cursos: (loggedUser.subjects || []).slice(0, 3).map(s => ({
          id: s.id,
          titulo: s.title,
          progreso: s.progress,
          imagen_url: null
        })),
        proximos_examenes: HARDCODED_DATA.activities.upcoming.filter(a => a.type === 'Examen').map(e => ({
          id: e.id,
          titulo: e.title,
          fecha: e.date,
          curso_nombre: e.title.split(' - ')[0]
        })),
        pendientes_count: 5,
        racha_dias: loggedUser.streak || 0,
        puntos_totales: loggedUser.puntos_gamificacion || 0,
        nivel_actual: loggedUser.nivel || 1
      };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.USERS.GET_PROGRESS) {
      // Simulate progress data matching backend structure
      return {
        progreso_cursos: (loggedUser.subjects || []).map(s => ({
          curso_id: s.id,
          curso_titulo: s.title,
          imagen_portada: null,
          progreso_porcentaje: s.progress || 0,
          recursos_completados: Math.round((s.progress / 100) * 20),
          total_recursos: 20,
          total_examenes: 2,
          promedio_examenes: 85.5,
          completado: s.progress === 100,
          fecha_inscripcion: '2024-01-15'
        })),
        logros_desbloqueados: HARDCODED_DATA.achievements.slice(0, 3),
        logros_en_progreso: HARDCODED_DATA.achievements.slice(3, 5).map(a => ({ ...a, progreso_actual: 50, porcentaje_progreso: 50 })),
        estadisticas: {
          total_puntos: loggedUser.puntos_gamificacion || 0,
          nivel: loggedUser.nivel || 1,
          total_cursos: (loggedUser.subjects || []).length,
          cursos_completados: (loggedUser.subjects || []).filter(s => s.progress === 100).length,
          actividades_semana: 12,
          tiempo_total_minutos: 450,
          tiempo_total_horas: 7.5
        },
        actividades_recientes: []
      };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL) {
      return deepClone(HARDCODED_DATA.subjectsCatalog);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.GET_USER_SUBJECTS) {
      if (loggedUser.rol !== 'ESTUDIANTE') return [];
      return deepClone(loggedUser.subjects || []);
    }

    // Handle enrollment (new dynamic URL: /cursos/{id}/inscribirse/)
    if (endpoint.includes('/inscribirse/') && method === 'POST') {
      if (loggedUser.rol !== 'ESTUDIANTE') return { success: false };

      // Extract ID from /cursos/{id}/inscribirse/
      const parts = endpoint.split('/');
      const subjectId = parts[parts.length - 3] || parts[parts.length - 2];

      const subject = HARDCODED_DATA.subjectsCatalog.find((s) => s.id === subjectId);
      if (subject && !(loggedUser.subjects || []).some((s) => s.id === subject.id)) {
        loggedUser.subjects = loggedUser.subjects || [];
        loggedUser.subjects.push({ ...deepClone(subject), examDate: null });
      }
      return { success: true };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.UPDATE_EXAM_DATE && method === 'PUT') {
      if (loggedUser.rol !== 'ESTUDIANTE') return { success: false };
      const subject = (loggedUser.subjects || []).find((s) => s.id === data?.subjectId);
      if (subject) {
        subject.examDate = data.examDate || null;
        subject.examTime = data.examTime || null;
      }

      const subjectTitle = subject?.title || 'Materia';
      const existsIndex = (this.upcomingActivities || []).findIndex(
        (a) => a.origen === 'FECHA_EXAMEN' && a.curso_id === data?.subjectId
      );
      if (!data?.examDate) {
        if (existsIndex >= 0) this.upcomingActivities.splice(existsIndex, 1);
        return { success: true, examDate: null, examTime: null };
      }
      const activity = {
        id: this.nextId('act'),
        titulo: subjectTitle,
        tipo: 'EXAMEN',
        fecha: data.examDate,
        hora: data.examTime || null,
        origen: 'FECHA_EXAMEN',
        curso_id: data?.subjectId,
        curso_titulo: subjectTitle
      };
      if (existsIndex >= 0) this.upcomingActivities[existsIndex] = { ...this.upcomingActivities[existsIndex], ...activity };
      else this.upcomingActivities.unshift(activity);
      return { success: true, examDate: data.examDate, examTime: data.examTime || null };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING && method === 'GET') {
      return deepClone(this.upcomingActivities || []);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING && method === 'POST') {
      const newActivity = {
        id: this.nextId('act'),
        titulo: data?.titulo || 'Actividad',
        tipo: data?.tipo || 'OTRO',
        fecha: data?.fecha,
        hora: data?.hora || null,
        origen: 'MANUAL',
        curso_id: null,
        curso_titulo: null
      };
      this.upcomingActivities = this.upcomingActivities || [];
      this.upcomingActivities.unshift(newActivity);
      return deepClone(newActivity);
    }

    if (endpoint.startsWith(API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING) && method === 'DELETE') {
      const id = endpoint.split('/').filter(Boolean).pop();
      this.upcomingActivities = (this.upcomingActivities || []).filter((activity) => activity.id !== id);
      return { success: true };
    }

    // Handle course specific progress: /cursos/{id}/mi_progreso/
    if (endpoint.includes('/cursos/') && endpoint.endsWith('/mi_progreso/')) {
      // Extract ID
      const parts = endpoint.split('/');
      const subjectId = parts[parts.length - 3] || parts[parts.length - 2];
      const subject = (loggedUser.subjects || []).find(s => s.id === subjectId);

      if (!subject) return { error: 'No inscrito' };

      return {
        progreso_asignatura: {
          id: subject.id,
          titulo: subject.title,
          completado_porcentaje: subject.progress || 0,
          fecha_inicio: '2024-01-20'
        },
        modulos: (subject.temario || []).map((tema, i) => ({
          id: `mod-${i}`,
          titulo: tema.title,
          completado: i < ((subject.progress / 100) * (subject.temario || []).length), // Rough estimate
          recursos: [
            { id: `res-${i}-1`, titulo: `Video: ${tema.title}`, completado: true },
            { id: `res-${i}-2`, titulo: `Lectura: ${tema.title}`, completado: false }
          ]
        }))
      };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.RESOURCES.GET_ALL) {
      return deepClone(HARDCODED_DATA.resources);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.RESOURCES.GET_PURCHASED) {
      if (loggedUser.rol !== 'ESTUDIANTE') return [];
      const purchasedIds = this.getUserPurchases();
      const purchased = HARDCODED_DATA.resources.filter((r) => purchasedIds.includes(r.id));
      return deepClone(purchased);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.RESOURCES.PURCHASE && method === 'POST') {
      if (loggedUser.rol !== 'ESTUDIANTE') return { success: false };
      if (data?.resourceId) {
        const purchases = this.getUserPurchases();
        if (!purchases.includes(data.resourceId)) {
          purchases.push(data.resourceId);
        }
      }
      return { success: true };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.RESOURCES.DOWNLOAD && method === 'POST') {
      return { success: true, url: '#' };
    }

    // Handle marking resource as completed: /recursos/{id}/marcar_completado/
    if (endpoint.includes('/recursos/') && endpoint.includes('/marcar_completado/') && method === 'POST') {
      if (loggedUser.rol !== 'ESTUDIANTE') return { success: false };

      const parts = endpoint.split('/');
      // format: /api/recursos/{id}/marcar_completado/
      // parts: ['', 'api', 'recursos', '{id}', 'marcar_completado', '']
      const resourceId = parts[parts.length - 3] || parts[parts.length - 2];

      const resource = HARDCODED_DATA.resources.find(r => r.id === resourceId);
      if (resource) {
        const userSubject = (loggedUser.subjects || []).find(s => s.id === resource.subjectId);
        if (userSubject) {
          // Increment progress safely
          const currentProgress = userSubject.progress || 0;
          if (currentProgress < 100) {
            userSubject.progress = Math.min(100, currentProgress + 5); // +5% per resource for demo
          }
          // Update last access
          userSubject.fecha_ultimo_acceso = new Date().toISOString();
        }
      }
      return { success: true, message: 'Recurso marcado como completado' };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.FORMULARIES.GET_ALL) {
      return deepClone(HARDCODED_DATA.formularies);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_ALL) {
      return deepClone(HARDCODED_DATA.achievements);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_USER_ACHIEVEMENTS) {
      return HARDCODED_DATA.achievements.map((ach, index) => ({
        logro: deepClone(ach),
        progreso_actual: index === 0 ? 100 : 0, // Demo: first one unlocked
        desbloqueado: index === 0,
        porcentaje_progreso: index === 0 ? 100 : 0
      }));
    }

    if (endpoint === API_CONFIG.ENDPOINTS.EXAMS.GET_ALL) {
      return deepClone(HARDCODED_DATA.exams);
    }

    // Handle start exam (new dynamic URL: /examenes/{id}/iniciar/)
    if (endpoint.includes('/examenes/') && endpoint.includes('/iniciar/') && method === 'POST') {
      // Extract ID
      const parts = endpoint.split('/');
      const examId = parts[parts.length - 3] || parts[parts.length - 2];

      const exam = HARDCODED_DATA.exams.find((e) => e.id === examId);
      if (!exam) throw new Error('Examen no encontrado (demo)');
      return deepClone(exam);
    }

    // Handle submit exam (new dynamic URL: /examenes/{id}/enviar_respuestas/)
    if (endpoint.includes('/examenes/') && endpoint.includes('/enviar_respuestas/') && method === 'POST') {
      // Extract ID
      const parts = endpoint.split('/');
      const examId = parts[parts.length - 3] || parts[parts.length - 2];

      const exam = HARDCODED_DATA.exams.find((e) => e.id === examId);
      if (!exam) throw new Error('Examen no encontrado (demo)');
      const answers = data?.answers || {};
      const correct = exam.questions.filter(
        (q) => (answers[q.id] || '').replace(/\s+/g, '').toLowerCase() === q.answer.replace(/\s+/g, '').toLowerCase()
      ).length;
      const total = exam.questions.length;
      return { calificacion: Math.round((correct / total) * 100), correctas: correct, total };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.TUTORS.GET_ALL) {
      return deepClone(HARDCODED_DATA.tutors);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.TUTORS.SCHEDULE && method === 'POST') {
      return { success: true, message: 'Tutoría agendada (demo)' };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.FORUMS.GET_ALL) {
      return deepClone(
        HARDCODED_DATA.forums.map((topic) => ({
          id: topic.id,
          title: topic.title,
          subjectName: topic.subjectName,
          postCount: (topic.posts || []).length,
          lastActivity: topic.posts?.[topic.posts.length - 1]?.createdAt
        }))
      );
    }

    if (endpoint === API_CONFIG.ENDPOINTS.FORUMS.CREATE_TOPIC && method === 'POST') {
      const subject = HARDCODED_DATA.subjectsCatalog.find((s) => s.id === data?.curso);
      const newTopic = {
        id: this.nextId('forum'),
        title: data?.titulo || data?.title || 'Tema sin título',
        subjectName: subject?.title || 'General',
        posts: [
          {
            id: this.nextId('post'),
            author: loggedUser.name,
            content: data?.contenido || data?.content || '',
            createdAt: new Date().toISOString()
          }
        ]
      };
      HARDCODED_DATA.forums.unshift(newTopic);
      return { success: true, topic: deepClone(newTopic) };
    }

    // Handle vote answer: /foro/respuesta/{id}/votar/
    if (endpoint.includes('/foro/respuesta/') && endpoint.endsWith('/votar/') && method === 'POST') {
      const parts = endpoint.split('/');
      // format: /api/foro/respuesta/{id}/votar/
      const answerId = parts[parts.length - 3] || parts[parts.length - 2];

      let answerFound = null;
      for (const forum of HARDCODED_DATA.forums) {
        const post = forum.posts?.find(p => p.id === answerId);
        if (post) {
          answerFound = post;
          break;
        }
      }

      if (answerFound) {
        answerFound.votes = (answerFound.votes || 0) + 1;
        return { success: true, votes: answerFound.votes };
      }
      return { success: false, message: 'Respuesta no encontrada' };
    }

    if (endpoint.startsWith(API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC)) {
      // Handle reply: /foro/{id}/responder/
      if (endpoint.endsWith('/responder/') && method === 'POST') {
        const parts = endpoint.split('/').filter(Boolean);
        const topicId = parts[parts.length - 2];
        const topic = HARDCODED_DATA.forums.find((forum) => forum.id === topicId);
        if (!topic) throw new Error('Tema no encontrado');
        const newPost = {
          id: this.nextId('post'),
          author: loggedUser.name,
          content: data?.contenido || data?.message || '',
          createdAt: new Date().toISOString()
        };
        topic.posts = topic.posts || [];
        topic.posts.push(newPost);
        return { success: true, post: deepClone(newPost) };
      }
      const topicId = endpoint.split('/').pop();
      const topic = HARDCODED_DATA.forums.find((forum) => forum.id === topicId);
      if (!topic) throw new Error('Tema no encontrado');
      return deepClone({
        id: topic.id,
        title: topic.title,
        subjectName: topic.subjectName,
        posts: topic.posts || []
      });
    }

    if (endpoint === API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_USER_NOTIFICATIONS) {
      return deepClone(loggedUser.notifications || HARDCODED_DATA.notifications);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ && method === 'POST') {
      const notifications = loggedUser.notifications || (loggedUser.notifications = deepClone(HARDCODED_DATA.notifications));
      const notification = notifications.find((n) => n.id === data?.notificationId);
      if (notification) notification.read = true;
      return { success: true };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ADMIN.USERS) {
      return deepClone(HARDCODED_DATA.adminUsers || []);
    }

    if (endpoint.startsWith(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}/`) && method === 'PUT') {
      const userId = endpoint.split('/').pop();
      const action = data?.action;
      HARDCODED_DATA.adminUsers = HARDCODED_DATA.adminUsers || [];
      if (action === 'delete') {
        HARDCODED_DATA.adminUsers = HARDCODED_DATA.adminUsers.filter((user) => user.id !== userId);
      } else {
        const user = HARDCODED_DATA.adminUsers.find((user) => user.id === userId);
        if (user) Object.assign(user, data);
      }
      return { success: true };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS && method === 'POST') {
      const newSubject = {
        id: this.nextId('subject'),
        title: data?.title || 'Materia sin título',
        description: data?.description || 'Descripción pendiente',
        professor: data?.professor || 'Profesor asignado',
        school: data?.school || 'General',
        progress: 0,
        level: data?.level || 'General',
        temario: []
      };
      HARDCODED_DATA.subjectsCatalog.push(newSubject);
      return { success: true, subject: deepClone(newSubject) };
    }

    if (endpoint.startsWith(`${API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS}/`)) {
      const subjectId = endpoint.split('/').pop();
      const index = HARDCODED_DATA.subjectsCatalog.findIndex((subject) => subject.id === subjectId);
      if (index === -1) {
        return { success: false, message: 'Materia no encontrada' };
      }
      if (method === 'PUT') {
        HARDCODED_DATA.subjectsCatalog[index] = {
          ...HARDCODED_DATA.subjectsCatalog[index],
          ...data
        };
        return { success: true, subject: deepClone(HARDCODED_DATA.subjectsCatalog[index]) };
      }
      if (method === 'DELETE') {
        HARDCODED_DATA.subjectsCatalog.splice(index, 1);
        return { success: true };
      }
    }

    // Handle community resources (prevent crash in DashboardShell)
    if (endpoint.startsWith(API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE)) {
      return [];
    }

    if (endpoint.includes('buscar-cursos')) {
      // Extract query param 'q'
      // URL format: /buscar-cursos/?q=term
      // But DemoAPI.handle receives endpoint as string.
      // Wait, request() calls DemoAPI.handle(endpoint, ...).
      // So passed endpoint has query params if I construct it that way.
      // Let's parse it.
      const query = endpoint.split('q=')[1]?.split('&')[0] || '';
      const term = this.normalize(decodeURIComponent(query));
      if (!term) return deepClone(HARDCODED_DATA.subjectsCatalog);

      return deepClone(HARDCODED_DATA.subjectsCatalog.filter(s =>
        this.normalize(s.title).includes(term) ||
        this.normalize(s.level).includes(term) ||
        this.normalize(s.school).includes(term)
      ));
    }

    return {};
  }
};

const request = async (endpoint, method = 'GET', data = null, requiresAuth = true) => {
  if (isDemoMode()) {
    return DemoAPI.handle(endpoint, method, data);
  }
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (requiresAuth) {
    const token = localStorage.getItem('authToken');
    if (token) headers.Authorization = `Token ${token}`;
  }
  const options = { method, headers, credentials: 'include' };
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = JSON.stringify(data);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.message || errorData.detail;

    if (!errorMessage && typeof errorData === 'object') {
      const values = Object.values(errorData).flat();
      if (values.length > 0) {
        errorMessage = values.join(', ');
      }
    }

    throw new Error(errorMessage || `Error ${response.status}`);
  }
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

export const apiService = {
  async login(identifier, password) {
    const payload = isDemoMode()
      ? { email: identifier, password }
      : { username: identifier, password };
    if (!isDemoMode() && identifier.includes('@')) {
      payload.email = identifier;
    }
    try {
      const raw = await request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, 'POST', payload, false);
      if (raw?.success && raw?.token) return raw;
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
      const response = await request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, 'POST', userData, false);
      if (response?.success) return response;
      return { success: true, message: response?.message || 'Registro exitoso' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  logout() {
    return request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, 'POST');
  },
  getProfile() {
    return request(API_CONFIG.ENDPOINTS.USERS.GET_PROFILE);
  },
  updateProfile(profileData) {
    return request(API_CONFIG.ENDPOINTS.USERS.UPDATE_PROFILE, 'PUT', profileData);
  },
  getAllSubjects() {
    return request(API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL);
  },
  getUserSubjects() {
    return request(API_CONFIG.ENDPOINTS.SUBJECTS.GET_USER_SUBJECTS).then((raw) => {
      if (!Array.isArray(raw)) return [];
      if (raw.length > 0 && raw[0] && typeof raw[0] === 'object' && raw[0].curso) {
        return raw.map((row) => {
          const course = row.curso || {};
          const creator = course.creador || {};
          return {
            id: course.id,
            title: course.titulo || course.title || 'Materia',
            description: course.descripcion || course.description || '',
            professor: creator.nombre_completo || course.professor || 'Profesor',
            school: course.school || 'ESCOM',
            progress: Number(row.progreso_porcentaje) || 0,
            examDate: row.examDate || null,
            examTime: row.examTime || null,
            temario: []
          };
        });
      }
      return raw;
    });
  },
  searchCourses(query) {
    // GET /api/buscar-cursos/?q=...
    // Note: checks if query is empty or not
    const endpoint = `/buscar-cursos/?q=${encodeURIComponent(query)}`;
    return request(endpoint);
  },
  addSubject(subjectId) {
    // Backend expects: POST /api/cursos/{id}/inscribirse/
    return request(`${API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL}${subjectId}/inscribirse/`, 'POST');
  },
  getCourseProgress(subjectId) {
    // GET /api/cursos/{id}/mi_progreso/
    return request(`${API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL}${subjectId}/mi_progreso/`);
  },
  getDashboard() {
    return request(API_CONFIG.ENDPOINTS.USERS.GET_DASHBOARD);
  },
  getDetailedProgress() {
    return request(API_CONFIG.ENDPOINTS.USERS.GET_PROGRESS);
  },
  updateExamDate(subjectId, examDate) {
    const payload = { subjectId, examDate };
    if (arguments.length >= 3) payload.examTime = arguments[2];
    return request(API_CONFIG.ENDPOINTS.SUBJECTS.UPDATE_EXAM_DATE, 'PUT', payload);
  },
  getUpcomingActivities() {
    return request(API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING).then((raw) => {
      if (!Array.isArray(raw)) return [];
      return raw.map((activity) => ({
        id: activity.id,
        title: activity.titulo || activity.title || 'Actividad',
        type: activity.tipo || activity.type || 'OTRO',
        date: activity.fecha || activity.date,
        time: activity.hora || activity.time || null,
        origin: activity.origen || activity.origin || 'MANUAL',
        courseId: activity.curso_id || activity.courseId || null,
        courseTitle: activity.curso_titulo || activity.courseTitle || null
      }));
    });
  },
  createUpcomingActivity({ title, type, date, time }) {
    return request(API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING, 'POST', {
      titulo: title,
      tipo: type,
      fecha: date,
      hora: time || null
    });
  },
  deleteUpcomingActivity(activityId) {
    return request(`${API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING}${activityId}/`, 'DELETE');
  },
  getAllResources() {
    return request(API_CONFIG.ENDPOINTS.RESOURCES.GET_ALL);
  },
  getPurchasedResources() {
    return request(API_CONFIG.ENDPOINTS.RESOURCES.GET_PURCHASED);
  },
  purchaseResource(resourceId) {
    return request(API_CONFIG.ENDPOINTS.RESOURCES.PURCHASE, 'POST', { resourceId });
  },
  downloadResource(resourceId) {
    return request(API_CONFIG.ENDPOINTS.RESOURCES.DOWNLOAD, 'POST', { resourceId });
  },
  markResourceCompleted(resourceId) {
    // POST /api/recursos/{id}/marcar_completado/
    return request(`${API_CONFIG.ENDPOINTS.RESOURCES.GET_ALL}${resourceId}/marcar_completado/`, 'POST');
  },
  getAllFormularies() {
    return request(API_CONFIG.ENDPOINTS.FORMULARIES.GET_ALL);
  },
  getAllAchievements() {
    return request(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_ALL);
  },
  getAllExams() {
    return request(API_CONFIG.ENDPOINTS.EXAMS.GET_ALL);
  },
  startExam(examId) {
    // Backend expects: POST /api/examenes/{id}/iniciar/
    return request(`${API_CONFIG.ENDPOINTS.EXAMS.GET_ALL}${examId}/iniciar/`, 'POST');
  },
  submitExam(examId, answers) {
    // Backend expects: POST /api/examenes/{id}/enviar_respuestas/
    return request(`${API_CONFIG.ENDPOINTS.EXAMS.GET_ALL}${examId}/enviar_respuestas/`, 'POST', { answers });
  },
  getAllTutors() {
    return request(API_CONFIG.ENDPOINTS.TUTORS.GET_ALL);
  },
  scheduleTutoring(tutorId, subjectId, duration, topic) {
    return request(API_CONFIG.ENDPOINTS.TUTORS.SCHEDULE, 'POST', { tutorId, subjectId, duration, topic });
  },
  getAllForums() {
    return request(API_CONFIG.ENDPOINTS.FORUMS.GET_ALL);
  },
  createForumTopic(topicData) {
    // Map keys for backend: { title -> titulo, content -> contenido, subjectId -> curso }
    const payload = {
      titulo: topicData.title,
      contenido: topicData.content,
      categoria: topicData.category || 'General',
      curso: topicData.subjectId
    };
    return request(API_CONFIG.ENDPOINTS.FORUMS.CREATE_TOPIC, 'POST', payload);
  },
  getForumTopic(topicId) {
    // GET /foro/{id}/
    return request(`${API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC}${topicId}/`);
  },
  replyForumTopic(topicId, message) {
    // POST /foro/{id}/responder/ with { contenido }
    return request(`${API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC}${topicId}/responder/`, 'POST', { contenido: message });
  },
  voteAnswer(answerId) {
    // POST /api/foro/respuesta/{id}/votar/
    return request(`/foro/respuesta/${answerId}/votar/`, 'POST');
  },
  getUserAchievements() {
    return request(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_USER_ACHIEVEMENTS);
  },
  getUserNotifications() {
    return request(API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_USER_NOTIFICATIONS);
  },
  markNotificationAsRead(notificationId) {
    return request(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ, 'POST', { notificationId });
  },
  getAllUsers() {
    return request(API_CONFIG.ENDPOINTS.ADMIN.USERS);
  },
  manageUser(userId, action, data = {}) {
    return request(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}`, 'PUT', { action, ...data });
  },
  createSubject(subjectData) {
    return request(API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS, 'POST', subjectData);
  },
  updateSubject(subjectId, subjectData) {
    return request(`${API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS}/${subjectId}`, 'PUT', subjectData);
  },
  deleteSubject(subjectId) {
    return request(`${API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS}/${subjectId}`, 'DELETE');
  },
  // Community Resources
  createCommunityResource(resourceData) {
    return request(API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE, 'POST', resourceData);
  },
  getMyCommunityResources() {
    return request(API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.MY_RESOURCES);
  },
  getCommunityResources(query = '', type = '') {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (type) params.append('tipo', type);
    return request(`${API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.SEARCH}?${params.toString()}`);
  }
};
