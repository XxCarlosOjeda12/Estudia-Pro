import { API_CONFIG, HARDCODED_DATA, DEMO_PROFILES } from './constants.js';
import { putDemoFile } from './demoFileStore.js';

const DEMO_STORAGE_KEY = 'estudia-pro-demo-mode';
const DEMO_TUTOR_PROFILES_KEY = 'estudia-pro-demo-tutor-profiles';
const DEMO_SYNC_KEY = 'estudia-pro-demo-sync';
const DEMO_SYNC_CHANNEL = 'estudia-pro-demo-sync';
const DEMO_EXTRA_USERS_KEY = 'estudia-pro-demo-extra-users';
const DEMO_ADMIN_USERS_KEY = 'estudia-pro-demo-admin-users';
const DEMO_SUBJECTS_KEY = 'estudia-pro-demo-subjects';
const DEMO_COMMUNITY_RESOURCES_KEY = 'estudia-pro-demo-community-resources';
const DEMO_FORMULARIES_KEY = 'estudia-pro-demo-formularies';
const DEMO_FORUMS_KEY = 'estudia-pro-demo-forums';
const DEMO_USER_STATE_KEY = 'estudia-pro-demo-user-state';
const DEMO_LATENCY = 350;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const isFormData = (value) => typeof FormData !== 'undefined' && value instanceof FormData;

const formDataToObject = (formData) => {
  const payload = {};
  for (const [key, value] of formData.entries()) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      const existing = payload[key];
      payload[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      payload[key] = value;
    }
  }
  return payload;
};

const readJsonFromStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJsonToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

const coerceNumberOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const DemoModeController = (() => {
  let enabled = false;
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored !== null) {
      enabled = stored === 'true';
    }
  } catch {
    enabled = false;
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
  currentUser: null,
  extraUsers: null,
  adminUsers: null,
  subjectsCatalog: null,
  communityResources: null,
  formularies: null,
  forums: null,
  tutorProfilesByUserId: null,
  userStateByUserId: null,
  syncChannel: typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(DEMO_SYNC_CHANNEL) : null,
  async simulateLatency() {
    return new Promise((resolve) => setTimeout(resolve, DEMO_LATENCY));
  },
  normalize(text) {
    return (text || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },
  nextId(prefix) {
    return `${prefix}-${Date.now()}`;
  },
  broadcastChange(kind) {
    const payload = { kind, ts: Date.now() };
    try {
      localStorage.setItem(DEMO_SYNC_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
    try {
      this.syncChannel?.postMessage(payload);
    } catch {
      /* ignore */
    }
  },
  ensureExtraUsersLoaded() {
    if (this.extraUsers) return;
    this.extraUsers = readJsonFromStorage(DEMO_EXTRA_USERS_KEY, []);
  },
  saveExtraUsers() {
    if (!this.extraUsers) return;
    writeJsonToStorage(DEMO_EXTRA_USERS_KEY, this.extraUsers);
  },
  ensureAdminUsersLoaded() {
    if (this.adminUsers) return;
    this.adminUsers = readJsonFromStorage(DEMO_ADMIN_USERS_KEY, deepClone(HARDCODED_DATA.adminUsers || []));
  },
  saveAdminUsers() {
    if (!this.adminUsers) return;
    writeJsonToStorage(DEMO_ADMIN_USERS_KEY, this.adminUsers);
  },
  ensureSubjectsLoaded() {
    if (this.subjectsCatalog) return;
    this.subjectsCatalog = readJsonFromStorage(DEMO_SUBJECTS_KEY, deepClone(HARDCODED_DATA.subjectsCatalog || []));
  },
  saveSubjects() {
    if (!this.subjectsCatalog) return;
    writeJsonToStorage(DEMO_SUBJECTS_KEY, this.subjectsCatalog);
  },
  ensureCommunityResourcesLoaded() {
    if (this.communityResources) return;
    const stored = readJsonFromStorage(DEMO_COMMUNITY_RESOURCES_KEY, null);
    const defaults = deepClone(HARDCODED_DATA.communityResources || []);

    let list = Array.isArray(stored) ? stored : defaults;
    if (Array.isArray(stored) && stored.length === 0 && defaults.length) {
      list = defaults;
    }

    // Ensure all resources have a valid URL for demo purposes
    // This fixes issues where user-created or legacy demo data might be missing files
    const DEMO_URLS = [
      'demo/recurso-integrales.pdf',
      'demo/recurso-matrices.pdf',
      'demo/recurso-probabilidad.pdf',
      'demo/formulario-derivadas.pdf'
    ];

    let changed = false;
    this.communityResources = list.map((item, index) => {
      // Check if it has any valid URL field
      const hasUrl = item.archivo_url || item.contenido_url || item.url || (item.fileId);
      if (!hasUrl) {
        changed = true;
        // Assign a deterministic demo URL based on index or ID to keep it consistent
        const demoUrl = DEMO_URLS[index % DEMO_URLS.length];
        return { ...item, archivo_url: demoUrl };
      }
      return item;
    });

    if (changed || !stored) {
      this.saveCommunityResources();
    }
  },
  saveCommunityResources() {
    if (!this.communityResources) return;
    writeJsonToStorage(DEMO_COMMUNITY_RESOURCES_KEY, this.communityResources);
  },
  ensureFormulariesLoaded() {
    if (this.formularies) return;
    const stored = readJsonFromStorage(DEMO_FORMULARIES_KEY, null);
    const defaults = deepClone(HARDCODED_DATA.formularies || []);
    const defaultsById = new Map(defaults.map((item) => [item.id, item]));

    let list = Array.isArray(stored) ? stored : defaults;
    if (Array.isArray(stored) && stored.length === 0 && defaults.length) {
      list = defaults;
    }

    let changed = false;
    this.formularies = (Array.isArray(list) ? list : []).map((item) => {
      const fallback = defaultsById.get(item?.id);
      if (!fallback) return item;
      if ((!item?.url || item.url === '#') && fallback.url && fallback.url !== '#') {
        changed = true;
        return { ...item, url: fallback.url };
      }
      return item;
    });

    if ((!Array.isArray(stored) || (Array.isArray(stored) && stored.length === 0 && defaults.length)) && !changed) {
      changed = true;
    }
    if (changed) this.saveFormularies();
  },
  saveFormularies() {
    if (!this.formularies) return;
    writeJsonToStorage(DEMO_FORMULARIES_KEY, this.formularies);
  },
  ensureForumsLoaded() {
    if (this.forums) return;
    this.forums = readJsonFromStorage(DEMO_FORUMS_KEY, deepClone(HARDCODED_DATA.forums || []));
  },
  saveForums() {
    if (!this.forums) return;
    writeJsonToStorage(DEMO_FORUMS_KEY, this.forums);
  },
  ensureUserStateLoaded() {
    if (this.userStateByUserId) return;
    this.userStateByUserId = readJsonFromStorage(DEMO_USER_STATE_KEY, {});
  },
  saveUserState() {
    if (!this.userStateByUserId) return;
    writeJsonToStorage(DEMO_USER_STATE_KEY, this.userStateByUserId);
  },
  getUserId(user) {
    return (user?.id || user?.username || user?.email || '').toString();
  },
  getOrCreateUserState(user) {
    this.ensureUserStateLoaded();
    const userId = this.getUserId(user);
    if (!userId) return null;
    if (!this.userStateByUserId[userId]) {
      this.userStateByUserId[userId] = {
        subjects: deepClone(user?.subjects || []),
        notifications: deepClone(user?.notifications || []),
        purchasedResources: deepClone(user?.purchasedResources || []),
        upcomingActivities: user?.rol === 'ESTUDIANTE' ? deepClone(HARDCODED_DATA.activities.upcoming || []) : [],
        updatedAt: Date.now()
      };
      this.saveUserState();
    }
    return this.userStateByUserId[userId];
  },
  hydrateUser(user) {
    const state = this.getOrCreateUserState(user);
    if (!state) return user;
    user.subjects = state.subjects;
    user.notifications = state.notifications;
    user.purchasedResources = state.purchasedResources;
    user.upcomingActivities = state.upcomingActivities;
    return user;
  },
  touchUserState(user) {
    const state = this.getOrCreateUserState(user);
    if (!state) return;
    state.updatedAt = Date.now();
    this.saveUserState();
  },
  getAllDemoUsers() {
    this.ensureExtraUsersLoaded();
    const base = Array.isArray(HARDCODED_DATA.demoUsersList) ? HARDCODED_DATA.demoUsersList : [];
    const extra = Array.isArray(this.extraUsers) ? this.extraUsers : [];
    return [...base, ...extra];
  },
  upsertAdminUserFromAuthProfile(profile) {
    this.ensureAdminUsersLoaded();
    if (!profile) return;
    const id = profile.id || profile.username || profile.email;
    if (!id) return;
    const displayName = profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || profile.email;
    const entry = {
      id: id.toString(),
      name: displayName || 'Usuario',
      email: profile.email || `${profile.username}@demo.local`,
      role: profile.rol || profile.role || 'ESTUDIANTE',
      verified: true
    };
    const index = this.adminUsers.findIndex((u) => u.id === entry.id);
    if (index >= 0) this.adminUsers[index] = { ...this.adminUsers[index], ...entry };
    else this.adminUsers.unshift(entry);
    this.saveAdminUsers();
  },
  ensureTutorProfilesLoaded() {
    if (this.tutorProfilesByUserId) return;
    this.tutorProfilesByUserId = readJsonFromStorage(DEMO_TUTOR_PROFILES_KEY, {});
  },
  saveTutorProfiles() {
    if (!this.tutorProfilesByUserId) return;
    writeJsonToStorage(DEMO_TUTOR_PROFILES_KEY, this.tutorProfilesByUserId);
  },
  getDefaultTutorProfile(user) {
    const displayName = user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || user?.email || 'Tutor';
    const isDemoCreator = user?.rol === 'CREADOR';

    return {
      specialties: isDemoCreator ? 'Cálculo, Álgebra' : 'Matemáticas',
      bio: isDemoCreator ? `Tutorías impartidas por ${displayName}.` : 'Tutor experto.',
      active: Boolean(isDemoCreator),
      tariff30: 150,
      tariff60: 250
    };
  },
  getTutorProfile(user) {
    this.ensureTutorProfilesLoaded();
    const userId = user?.id || user?.username || user?.email;
    if (!userId) return this.getDefaultTutorProfile(user);

    if (!this.tutorProfilesByUserId[userId]) {
      this.tutorProfilesByUserId[userId] = this.getDefaultTutorProfile(user);
      this.saveTutorProfiles();
    }
    return this.tutorProfilesByUserId[userId];
  },
  setTutorProfile(user, updates) {
    this.ensureTutorProfilesLoaded();
    const userId = user?.id || user?.username || user?.email;
    if (!userId) return this.getDefaultTutorProfile(user);

    const current = this.getTutorProfile(user);
    const merged = {
      ...current,
      ...updates
    };

    this.tutorProfilesByUserId[userId] = merged;
    this.saveTutorProfiles();
    return merged;
  },
  buildTutorEntryFromCreatorProfile(creatorUser) {
    const profile = this.getTutorProfile(creatorUser);
    const userId = creatorUser?.id || creatorUser?.username || creatorUser?.email || 'creator';
    const fullName = creatorUser?.name || `${creatorUser?.first_name || ''} ${creatorUser?.last_name || ''}`.trim() || creatorUser?.username || 'Creador';
    const rating = creatorUser?.dashboard?.rating ?? creatorUser?.calificacion_promedio ?? 4.7;
    const sessions = creatorUser?.dashboard?.studentsHelped ?? creatorUser?.dashboard?.students_helped ?? 0;

    return {
      id: `tutor-${userId}`,
      name: fullName,
      rating,
      sessions,
      specialties: profile.specialties,
      bio: profile.bio,
      tariff30: profile.tariff30,
      tariff60: profile.tariff60
    };
  },
  getAllTutors() {
    this.ensureTutorProfilesLoaded();
    const baseTutors = Array.isArray(HARDCODED_DATA.tutors) ? deepClone(HARDCODED_DATA.tutors) : [];

    const creators = this.getAllDemoUsers().filter((u) => u?.rol === 'CREADOR');
    for (const creatorUser of creators) {
      const profile = this.getTutorProfile(creatorUser);
      if (!profile.active) continue;
      baseTutors.push(this.buildTutorEntryFromCreatorProfile(creatorUser));
    }

    const seen = new Set();
    return baseTutors.filter((tutor) => {
      const id = tutor?.id;
      if (!id) return false;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  },
  getCurrentUser() {
    if (!this.currentUser) {
      this.currentUser = this.hydrateUser(deepClone(DEMO_PROFILES.estudiante));
    }
    return this.currentUser;
  },
  getUserPurchases() {
    const user = this.getCurrentUser();
    if (!Array.isArray(user.purchasedResources)) {
      user.purchasedResources = [...HARDCODED_DATA.purchasedResourceIds];
      this.touchUserState(user);
    }
    return user.purchasedResources;
  },
  async handle(endpoint, method, data) {
    if (isFormData(data)) {
      data = formDataToObject(data);
    }
    await this.simulateLatency();
    const loggedUser = this.getCurrentUser();
    const demoUsers = this.getAllDemoUsers();

    if (endpoint === API_CONFIG.ENDPOINTS.AUTH.LOGIN && method === 'POST') {
      const identifier = (data?.email || data?.username || '').toString().toLowerCase().trim();

      const profile = demoUsers.find((user) => {
        const u = (user.username || '').toString().toLowerCase().trim();
        const e = (user.email || '').toString().toLowerCase().trim();
        return u === identifier || (e && e === identifier);
      });

      if (profile && (profile.password || 'demo123') === data?.password) {
        this.currentUser = this.hydrateUser(deepClone(profile));
        localStorage.setItem('authToken', 'demo-token');
        return { success: true, token: 'demo-token', user: formatUserForFrontend(profile) };
      }
      return { success: false, message: 'Credenciales inválidas (demo@estudiapro.com / demo123)' };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.AUTH.REGISTER && method === 'POST') {
      this.ensureExtraUsersLoaded();
      this.ensureAdminUsersLoaded();

      const username = (data?.username || '').toString().trim();
      const email = (data?.email || '').toString().toLowerCase().trim();
      const password = (data?.password || '').toString();
      const firstName = (data?.first_name || data?.firstName || '').toString().trim();
      const lastName = (data?.last_name || data?.lastName || '').toString().trim();
      const rol = (data?.rol || data?.role || 'ESTUDIANTE').toString().toUpperCase();

      if (!username || !email || !password) {
        return { success: false, message: 'username, email y password son requeridos (demo)' };
      }
      if (!['ESTUDIANTE', 'CREADOR', 'ADMINISTRADOR'].includes(rol)) {
        return { success: false, message: 'rol inválido (demo)' };
      }
      const alreadyExists = this.getAllDemoUsers().some((u) => {
        const uName = (u.username || '').toString().toLowerCase().trim();
        const uMail = (u.email || '').toString().toLowerCase().trim();
        return uName === username.toLowerCase() || uMail === email;
      });
      if (alreadyExists) {
        return { success: false, message: 'Usuario o correo ya registrado (demo)' };
      }

      const id = `demo-${rol.toLowerCase()}-${Date.now()}`;
      const displayName =
        `${firstName || username} ${lastName || ''}`.trim() ||
        username;

      const newUser = {
        id,
        username,
        email,
        password,
        first_name: firstName || username,
        last_name: lastName || 'Usuario',
        name: displayName,
        rol,
        foto_perfil_url: '',
        nivel: 1,
        puntos_gamificacion: 0,
        streak: 0,
        notifications: [],
      };

      if (rol === 'ESTUDIANTE') {
        newUser.subjects = [];
        newUser.purchasedResources = [];
      }

      if (rol === 'CREADOR') {
        newUser.dashboard = {
          published: 0,
          rating: 4.7,
          studentsHelped: 0,
          tutoring: []
        };
        this.setTutorProfile(newUser, {
          specialties: (data?.specialidad || 'Matemáticas').toString(),
          bio: `Tutorías impartidas por ${displayName}.`,
          active: true,
          tariff30: 150,
          tariff60: 250
        });
      }

      this.extraUsers.unshift(newUser);
      this.saveExtraUsers();
      this.upsertAdminUserFromAuthProfile(newUser);
      this.hydrateUser(newUser);
      this.broadcastChange('users');

      return { success: true, message: 'Registro simulado. Inicia sesión con tus credenciales.', user: formatUserForFrontend(newUser) };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.AUTH.LOGOUT) {
      localStorage.removeItem('authToken');
      this.currentUser = this.hydrateUser(deepClone(DEMO_PROFILES.estudiante));
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
      this.ensureSubjectsLoaded();
      return deepClone(this.subjectsCatalog);
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

      this.ensureSubjectsLoaded();
      const subject = this.subjectsCatalog.find((s) => s.id === subjectId);
      if (subject && !(loggedUser.subjects || []).some((s) => s.id === subject.id)) {
        loggedUser.subjects = loggedUser.subjects || [];
        loggedUser.subjects.push({ ...deepClone(subject), examDate: null });
      }
      this.touchUserState(loggedUser);
      this.broadcastChange('subjects');
      return { success: true };
    }

    // Handle unenrollment (new dynamic URL: /cursos/{id}/desinscribirse/)
    if (endpoint.includes('/desinscribirse/') && method === 'POST') {
      if (loggedUser.rol !== 'ESTUDIANTE') return { success: false };

      const parts = endpoint.split('/');
      const subjectId = parts[parts.length - 3] || parts[parts.length - 2];

      loggedUser.subjects = (loggedUser.subjects || []).filter((s) => s.id !== subjectId);
      if (Array.isArray(loggedUser.upcomingActivities)) {
        loggedUser.upcomingActivities = loggedUser.upcomingActivities.filter((a) => a?.curso_id !== subjectId);
      }
      this.touchUserState(loggedUser);
      this.broadcastChange('subjects');
      this.broadcastChange('activities');
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
      loggedUser.upcomingActivities = loggedUser.upcomingActivities || [];
      const existsIndex = (loggedUser.upcomingActivities || []).findIndex(
        (a) => a.origen === 'FECHA_EXAMEN' && a.curso_id === data?.subjectId
      );
      if (!data?.examDate) {
        if (existsIndex >= 0) loggedUser.upcomingActivities.splice(existsIndex, 1);
        this.touchUserState(loggedUser);
        this.broadcastChange('activities');
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
      if (existsIndex >= 0) loggedUser.upcomingActivities[existsIndex] = { ...loggedUser.upcomingActivities[existsIndex], ...activity };
      else loggedUser.upcomingActivities.unshift(activity);
      this.touchUserState(loggedUser);
      this.broadcastChange('activities');
      return { success: true, examDate: data.examDate, examTime: data.examTime || null };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING && method === 'GET') {
      return deepClone(loggedUser.upcomingActivities || []);
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
      loggedUser.upcomingActivities = loggedUser.upcomingActivities || [];
      loggedUser.upcomingActivities.unshift(newActivity);
      this.touchUserState(loggedUser);
      this.broadcastChange('activities');
      return deepClone(newActivity);
    }

    if (endpoint.startsWith(API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING) && method === 'DELETE') {
      const id = endpoint.split('/').filter(Boolean).pop();
      loggedUser.upcomingActivities = (loggedUser.upcomingActivities || []).filter((activity) => activity.id !== id);
      this.touchUserState(loggedUser);
      this.broadcastChange('activities');
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
          this.touchUserState(loggedUser);
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
          this.touchUserState(loggedUser);
        }
      }
      return { success: true, message: 'Recurso marcado como completado' };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.FORMULARIES.GET_ALL) {
      this.ensureFormulariesLoaded();
      if (method === 'POST') {
        const title = (data?.title || data?.titulo || '').toString().trim();
        const subject = (data?.subject || data?.materia || '').toString().trim();
        const url = (data?.url || data?.archivo_url || '').toString().trim();
        const maybeFile = data?.file || data?.archivo || null;
        if (!title) return { success: false, message: 'title es requerido' };
        let fileId = null;
        let fileName = null;
        let mimeType = null;
        if (maybeFile instanceof Blob) {
          fileId = await putDemoFile(maybeFile);
          fileName = maybeFile?.name || 'formulario.pdf';
          mimeType = maybeFile?.type || 'application/pdf';
        }
        const item = {
          id: this.nextId('form'),
          title,
          subject: subject || 'General',
          type: 'PDF',
          url: url || '#',
          fileId,
          fileName,
          mimeType
        };
        this.formularies.unshift(item);
        this.saveFormularies();
        this.broadcastChange('formularies');
        return { success: true, formulary: deepClone(item) };
      }
      return deepClone(this.formularies);
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
      return deepClone(this.getAllTutors());
    }

    if (endpoint === API_CONFIG.ENDPOINTS.TUTORS.ME) {
      if (loggedUser.rol !== 'CREADOR') throw new Error('Solo disponible para creadores (demo)');
      if (method === 'GET') {
        return deepClone(this.getTutorProfile(loggedUser));
      }
      if (method === 'PUT') {
        const updated = this.setTutorProfile(loggedUser, {
          specialties: (data?.specialties ?? data?.materias ?? '').toString(),
          bio: (data?.bio ?? '').toString(),
          active: Boolean(data?.active ?? data?.activo ?? false),
          tariff30: coerceNumberOrNull(data?.tariff30 ?? data?.tarifa30 ?? data?.tarifa_30) ?? null,
          tariff60: coerceNumberOrNull(data?.tariff60 ?? data?.tarifa60 ?? data?.tarifa_60) ?? null
        });
        this.broadcastChange('tutors');
        return deepClone(updated);
      }
      return {};
    }

    if (endpoint === API_CONFIG.ENDPOINTS.TUTORS.SCHEDULE && method === 'POST') {
      const tutorId = data?.tutorId || data?.tutor || data?.id;
      const duration = data?.duration || 30;
      const topic = (data?.topic || '').toString().trim();

      if (loggedUser.rol === 'ESTUDIANTE') {
        loggedUser.notifications = loggedUser.notifications || deepClone(HARDCODED_DATA.notifications);
        loggedUser.notifications.unshift({
          id: this.nextId('notif'),
          title: 'Tutoría solicitada',
          message: `Tu solicitud fue enviada.${topic ? ` Tema: ${topic}` : ''}`,
          type: 'success',
          read: false,
          date: new Date().toISOString()
        });
        this.touchUserState(loggedUser);
      }

      const tutorCreatorId = typeof tutorId === 'string' && tutorId.startsWith('tutor-') ? tutorId.slice('tutor-'.length) : null;
      if (tutorCreatorId) {
        const creatorUser = this.getAllDemoUsers().find((u) => u?.id === tutorCreatorId);
        if (creatorUser) {
          const state = this.getOrCreateUserState(creatorUser);
          state.notifications = state.notifications || [];
          state.notifications.unshift({
            id: this.nextId('notif'),
            title: 'Solicitud de tutoría',
            message: `${loggedUser?.name || 'Un estudiante'} solicitó una tutoría de ${duration} min.${topic ? ` Tema: ${topic}` : ''}`,
            type: 'alert',
            read: false,
            date: new Date().toISOString()
          });
          this.saveUserState();
        }
      }
      this.broadcastChange('notifications');
      return { success: true, message: 'Tutoría agendada (demo)' };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.FORUMS.GET_ALL && method === 'GET') {
      this.ensureForumsLoaded();
      return deepClone(
        (this.forums || []).map((topic) => ({
          id: topic.id,
          title: topic.title,
          subjectName: topic.subjectName,
          postCount: (topic.posts || []).length,
          lastActivity: topic.posts?.[topic.posts.length - 1]?.createdAt
        }))
      );
    }

    if (endpoint === API_CONFIG.ENDPOINTS.FORUMS.CREATE_TOPIC && method === 'POST') {
      this.ensureSubjectsLoaded();
      this.ensureForumsLoaded();
      const subject = this.subjectsCatalog.find((s) => s.id === data?.curso);
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
      this.forums.unshift(newTopic);
      this.saveForums();
      this.broadcastChange('forums');
      return { success: true, topic: deepClone(newTopic) };
    }

    // Handle vote answer: /foro/respuesta/{id}/votar/
    if (endpoint.includes('/foro/respuesta/') && endpoint.endsWith('/votar/') && method === 'POST') {
      this.ensureForumsLoaded();
      const parts = endpoint.split('/');
      // format: /api/foro/respuesta/{id}/votar/
      const answerId = parts[parts.length - 3] || parts[parts.length - 2];

      let answerFound = null;
      for (const forum of this.forums || []) {
        const post = forum.posts?.find(p => p.id === answerId);
        if (post) {
          answerFound = post;
          break;
        }
      }

      if (answerFound) {
        answerFound.votes = (answerFound.votes || 0) + 1;
        this.saveForums();
        this.broadcastChange('forums');
        return { success: true, votes: answerFound.votes };
      }
      return { success: false, message: 'Respuesta no encontrada' };
    }

    if (endpoint.startsWith(API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC)) {
      this.ensureForumsLoaded();
      // Handle reply: /foro/{id}/responder/
      if (endpoint.endsWith('/responder/') && method === 'POST') {
        const parts = endpoint.split('/').filter(Boolean);
        const topicId = parts[parts.length - 2];
        const topic = (this.forums || []).find((forum) => forum.id === topicId);
        if (!topic) throw new Error('Tema no encontrado');
        const newPost = {
          id: this.nextId('post'),
          author: loggedUser.name,
          content: data?.contenido || data?.message || '',
          createdAt: new Date().toISOString()
        };
        topic.posts = topic.posts || [];
        topic.posts.push(newPost);
        this.saveForums();
        this.broadcastChange('forums');
        return { success: true, post: deepClone(newPost) };
      }
      const parts = endpoint.split('/').filter(Boolean);
      const topicId = parts[parts.length - 1];
      const topic = (this.forums || []).find((forum) => forum.id === topicId);
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
      this.touchUserState(loggedUser);
      this.broadcastChange('notifications');
      return { success: true };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ADMIN.USERS) {
      this.ensureAdminUsersLoaded();
      return deepClone(this.adminUsers || []);
    }

    if (endpoint.startsWith(API_CONFIG.ENDPOINTS.ADMIN.USERS) && method === 'PUT') {
      this.ensureAdminUsersLoaded();
      this.ensureExtraUsersLoaded();
      const userId = endpoint.split('/').filter(Boolean).pop();
      const action = data?.action;
      if (action === 'delete') {
        this.adminUsers = (this.adminUsers || []).filter((user) => user.id !== userId);
        this.extraUsers = (this.extraUsers || []).filter((user) => user.id !== userId);
        this.saveAdminUsers();
        this.saveExtraUsers();
        this.ensureUserStateLoaded();
        if (this.userStateByUserId?.[userId]) {
          delete this.userStateByUserId[userId];
          this.saveUserState();
        }
        this.broadcastChange('users');
      } else {
        const user = (this.adminUsers || []).find((u) => u.id === userId);
        if (user) Object.assign(user, data);
        this.saveAdminUsers();
        this.broadcastChange('users');
      }
      return { success: true };
    }

    if (endpoint === API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS && method === 'POST') {
      this.ensureSubjectsLoaded();
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
      this.subjectsCatalog.push(newSubject);
      this.saveSubjects();
      this.broadcastChange('subjects');
      return { success: true, subject: deepClone(newSubject) };
    }

    if (endpoint.startsWith(API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS) && endpoint !== API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS) {
      this.ensureSubjectsLoaded();
      const subjectId = endpoint.split('/').filter(Boolean).pop();
      const index = this.subjectsCatalog.findIndex((subject) => subject.id === subjectId);
      if (index === -1) {
        return { success: false, message: 'Materia no encontrada' };
      }
      if (method === 'PUT') {
        this.subjectsCatalog[index] = {
          ...this.subjectsCatalog[index],
          ...data
        };
        this.saveSubjects();
        this.broadcastChange('subjects');
        return { success: true, subject: deepClone(this.subjectsCatalog[index]) };
      }
      if (method === 'DELETE') {
        this.subjectsCatalog.splice(index, 1);
        this.saveSubjects();
        this.ensureUserStateLoaded();
        const subjectIdToRemove = subjectId;
        if (this.userStateByUserId && subjectIdToRemove) {
          Object.values(this.userStateByUserId).forEach((state) => {
            if (!state?.subjects) return;
            state.subjects = state.subjects.filter((s) => s?.id !== subjectIdToRemove);
            if (Array.isArray(state.upcomingActivities)) {
              state.upcomingActivities = state.upcomingActivities.filter((a) => a?.curso_id !== subjectIdToRemove);
            }
            state.updatedAt = Date.now();
          });
          this.saveUserState();
        }
        this.broadcastChange('subjects');
        return { success: true };
      }
    }

    // Community resources (demo persistence + sync)
    if (endpoint.startsWith(API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE)) {
      this.ensureCommunityResourcesLoaded();

      if (endpoint === API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE) {
        if (method === 'POST') {
          const title = (data?.titulo || data?.title || '').toString().trim();
          const description = (data?.descripcion || data?.description || '').toString().trim();
          const type = (data?.tipo || data?.type || 'DOCUMENTO').toString().toUpperCase();
          const url = (data?.archivo_url || data?.archivoUrl || '').toString().trim();
          const text = (data?.contenido_texto || data?.contenidoTexto || '').toString();
          const file = data?.file || data?.archivo || null;

          if (!title) throw new Error('titulo es requerido');

          let fileId = null;
          let fileName = null;
          let fileType = null;
          if (file instanceof Blob) {
            fileId = await putDemoFile(file);
            fileName = file?.name || 'recurso';
            fileType = file?.type || null;
          }

          const authorSnapshot = {
            id: loggedUser.id,
            username: loggedUser.username,
            first_name: loggedUser.first_name,
            last_name: loggedUser.last_name,
            name: loggedUser.name
          };

          const item = {
            id: this.nextId('community'),
            titulo: title,
            descripcion: description,
            tipo: type,
            archivo_url: url || null,
            contenido_texto: text || '',
            autor: authorSnapshot,
            autor_id: loggedUser.id,
            fecha_creacion: new Date().toISOString(),
            descargas: 0,
            calificacion_promedio: 0,
            aprobado: true,
            activo: true,
            fileId,
            fileName,
            fileType
          };

          this.communityResources.unshift(item);
          this.saveCommunityResources();
          this.broadcastChange('resources');
          return deepClone(item);
        }

        if (method === 'GET') {
          return deepClone((this.communityResources || []).filter((r) => r.activo && r.aprobado));
        }
      }

      if (endpoint.startsWith(API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.MY_RESOURCES) && method === 'GET') {
        const mine = (this.communityResources || []).filter((r) => r.autor_id === loggedUser.id);
        return deepClone(mine);
      }

      if (endpoint.startsWith(API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.SEARCH) && method === 'GET') {
        const queryString = endpoint.split('?')[1] || '';
        const params = new URLSearchParams(queryString);
        const q = this.normalize(params.get('q') || '');
        const tipo = this.normalize(params.get('tipo') || '');

        let list = (this.communityResources || []).filter((r) => r.activo && r.aprobado);
        if (q) {
          list = list.filter((r) => this.normalize(r.titulo).includes(q) || this.normalize(r.descripcion).includes(q));
        }
        if (tipo) {
          list = list.filter((r) => this.normalize(r.tipo).includes(tipo));
        }
        return deepClone(list);
      }

      if (endpoint.includes('/descargar/') && method === 'POST') {
        const parts = endpoint.split('/').filter(Boolean);
        const resourceId = parts[parts.length - 2];
        const resource = (this.communityResources || []).find((r) => r.id === resourceId);
        if (!resource) throw new Error('Recurso no encontrado (demo)');
        resource.descargas = Number(resource.descargas || 0) + 1;
        this.saveCommunityResources();
        this.broadcastChange('resources');
        return {
          message: 'Descarga registrada',
          total_descargas: resource.descargas,
          url: resource.archivo_url || null,
          fileId: resource.fileId || null,
          fileName: resource.fileName || null,
          fileType: resource.fileType || null
        };
      }

      if (method === 'DELETE') {
        const parts = endpoint.split('/').filter(Boolean);
        const resourceId = parts[parts.length - 1];
        const index = (this.communityResources || []).findIndex((r) => r.id === resourceId);
        if (index === -1) throw new Error('Recurso no encontrado (demo)');
        const resource = this.communityResources[index];
        if (resource.autor_id !== loggedUser.id && loggedUser.rol !== 'ADMINISTRADOR') {
          return { success: false, message: 'No autorizado' };
        }
        this.communityResources.splice(index, 1);
        this.saveCommunityResources();
        this.broadcastChange('resources');
        return { success: true };
      }

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
      this.ensureSubjectsLoaded();
      if (!term) return deepClone(this.subjectsCatalog);

      return deepClone(this.subjectsCatalog.filter(s =>
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
  const headers = {};
  if (requiresAuth) {
    const token = localStorage.getItem('authToken');
    if (token) headers.Authorization = `Token ${token}`;
  }
  const options = { method, headers, credentials: 'include' };
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    if (isFormData(data)) {
      options.body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
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
  dropSubject(subjectId) {
    // Backend expects: POST /api/cursos/{id}/desinscribirse/
    return request(`${API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL}${subjectId}/desinscribirse/`, 'POST');
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
  createFormulary(payload) {
    return request(API_CONFIG.ENDPOINTS.FORMULARIES.GET_ALL, 'POST', payload);
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
    return request(API_CONFIG.ENDPOINTS.TUTORS.GET_ALL).then((raw) => {
      if (!Array.isArray(raw)) return [];
      return raw.map((tutor) => ({
        id: tutor.id,
        name: tutor.name || tutor.nombre || tutor.nombre_completo || tutor.username || 'Tutor',
        specialties: tutor.specialties || tutor.materia || tutor.especialidad || '',
        bio: tutor.bio || '',
        rating: tutor.rating ?? tutor.calificacion_promedio ?? null,
        sessions: tutor.sessions ?? tutor.sesiones ?? null,
        tariff30: tutor.tariff30 ?? tutor.tarifa30 ?? tutor.tarifa_30 ?? tutor.tarifa_30_min ?? 0,
        tariff60: tutor.tariff60 ?? tutor.tarifa60 ?? tutor.tarifa_60 ?? tutor.tarifa_60_min ?? 0
      }));
    });
  },
  getMyTutorProfile() {
    return request(API_CONFIG.ENDPOINTS.TUTORS.ME).then((raw) => ({
      specialties: raw?.specialties || raw?.materia || raw?.especialidad || '',
      bio: raw?.bio || '',
      active: Boolean(raw?.active ?? raw?.activo ?? false),
      tariff30: raw?.tariff30 ?? raw?.tarifa30 ?? raw?.tarifa_30 ?? raw?.tarifa_30_min ?? '',
      tariff60: raw?.tariff60 ?? raw?.tarifa60 ?? raw?.tarifa_60 ?? raw?.tarifa_60_min ?? ''
    }));
  },
  updateMyTutorProfile(profile) {
    return request(API_CONFIG.ENDPOINTS.TUTORS.ME, 'PUT', profile);
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
    return request(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}${userId}`, 'PUT', { action, ...data });
  },
  createSubject(subjectData) {
    return request(API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS, 'POST', subjectData);
  },
  updateSubject(subjectId, subjectData) {
    return request(`${API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS}${subjectId}`, 'PUT', subjectData);
  },
  deleteSubject(subjectId) {
    return request(`${API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS}${subjectId}`, 'DELETE');
  },
  // Community Resources
  createCommunityResource(resourceData) {
    return request(API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE, 'POST', resourceData);
  },
  downloadCommunityResource(resourceId) {
    return request(`${API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE}${resourceId}/descargar/`, 'POST');
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
