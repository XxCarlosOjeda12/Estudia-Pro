import { API_CONFIG, HARDCODED_DATA, DEMO_PROFILES } from './constants';

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
  async simulateLatency() {
    return new Promise((resolve) => setTimeout(resolve, DEMO_LATENCY));
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
      const identifier = (data?.email || data?.username || '').toLowerCase();
      const profile = demoUsers.find((user) =>
        [user.email?.toLowerCase(), user.username?.toLowerCase()].includes(identifier)
      );
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

    if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL) {
      return deepClone(HARDCODED_DATA.subjectsCatalog);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.GET_USER_SUBJECTS) {
      if (loggedUser.rol !== 'ESTUDIANTE') return [];
      return deepClone(loggedUser.subjects || []);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.ADD_SUBJECT && method === 'POST') {
      if (loggedUser.rol !== 'ESTUDIANTE') return { success: false };
      const subject = HARDCODED_DATA.subjectsCatalog.find((s) => s.id === data?.subjectId);
      if (subject && !(loggedUser.subjects || []).some((s) => s.id === subject.id)) {
        loggedUser.subjects = loggedUser.subjects || [];
        loggedUser.subjects.push({ ...deepClone(subject), examDate: null });
      }
      return { success: true };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.SUBJECTS.UPDATE_EXAM_DATE && method === 'PUT') {
      if (loggedUser.rol !== 'ESTUDIANTE') return { success: false };
      const subject = (loggedUser.subjects || []).find((s) => s.id === data?.subjectId);
      if (subject) subject.examDate = data.examDate;
      return { success: true };
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

    if (endpoint === API_CONFIG.ENDPOINTS.FORMULARIES.GET_ALL) {
      return deepClone(HARDCODED_DATA.formularies);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_ALL || endpoint === API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_USER_ACHIEVEMENTS) {
      return deepClone(HARDCODED_DATA.achievements);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.EXAMS.GET_ALL) {
      return deepClone(HARDCODED_DATA.exams);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.EXAMS.START_EXAM && method === 'POST') {
      const exam = HARDCODED_DATA.exams.find((e) => e.id === data?.examId);
      if (!exam) throw new Error('Examen no encontrado (demo)');
      return deepClone(exam);
    }

    if (endpoint === API_CONFIG.ENDPOINTS.EXAMS.SUBMIT_EXAM && method === 'POST') {
      const exam = HARDCODED_DATA.exams.find((e) => e.id === data?.examId);
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
      const subject = HARDCODED_DATA.subjectsCatalog.find((s) => s.id === data?.subjectId);
      const newTopic = {
        id: this.nextId('forum'),
        title: data?.title || 'Tema sin título',
        subjectName: subject?.title || 'General',
        posts: [
          {
            id: this.nextId('post'),
            author: loggedUser.name,
            content: data?.content || '',
            createdAt: new Date().toISOString()
          }
        ]
      };
      HARDCODED_DATA.forums.unshift(newTopic);
      return { success: true, topic: deepClone(newTopic) };
    }

    if (endpoint.startsWith(API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC)) {
      if (endpoint.endsWith('/reply') && method === 'POST') {
        const parts = endpoint.split('/').filter(Boolean);
        const topicId = parts[parts.length - 2];
        const topic = HARDCODED_DATA.forums.find((forum) => forum.id === topicId);
        if (!topic) throw new Error('Tema no encontrado');
        const newPost = {
          id: this.nextId('post'),
          author: loggedUser.name,
          content: data?.message || data?.content || '',
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
    throw new Error(errorData.message || `Error ${response.status}`);
  }
  return response.json();
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
    return request(API_CONFIG.ENDPOINTS.SUBJECTS.GET_USER_SUBJECTS);
  },
  addSubject(subjectId) {
    return request(API_CONFIG.ENDPOINTS.SUBJECTS.ADD_SUBJECT, 'POST', { subjectId });
  },
  updateExamDate(subjectId, examDate) {
    return request(API_CONFIG.ENDPOINTS.SUBJECTS.UPDATE_EXAM_DATE, 'PUT', { subjectId, examDate });
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
    return request(API_CONFIG.ENDPOINTS.EXAMS.START_EXAM, 'POST', { examId });
  },
  submitExam(examId, answers) {
    return request(API_CONFIG.ENDPOINTS.EXAMS.SUBMIT_EXAM, 'POST', { examId, answers });
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
    return request(API_CONFIG.ENDPOINTS.FORUMS.CREATE_TOPIC, 'POST', topicData);
  },
  getForumTopic(topicId) {
    return request(`${API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC}/${topicId}`);
  },
  replyForumTopic(topicId, message) {
    return request(`${API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC}/${topicId}/reply`, 'POST', { message });
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
  }
};
