import { API_CONFIG, HARDCODED_DATA, DEMO_PROFILES } from './constants.js';

const DEMO_STORAGE_KEY = 'estudia-pro-demo-mode';
const DEMO_LATENCY = 350;

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const DemoModeController = (() => {
  let enabled = false;  
  return {
    isEnabled: () => false,  
    setEnabled: (flag) => {
      enabled = false;
    },
    toggle: () => {
      return false;
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

const LOCAL_KEYS = {
  CUSTOM_ACTIVITIES: 'estudia-pro-custom-activities',
  EXAM_DATES: 'estudia-pro-exam-dates',
  PURCHASES: 'estudia-pro-purchases'
};

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const readLocalArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalArray = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

const addLocalActivity = (activity) => {
  const list = readLocalArray(LOCAL_KEYS.CUSTOM_ACTIVITIES);
  const entry = { id: activity.id || `local-${Date.now()}`, origin: 'MANUAL', ...activity };
  list.unshift(entry);
  writeLocalArray(LOCAL_KEYS.CUSTOM_ACTIVITIES, list);
  return entry;
};

const removeLocalActivity = (activityId) => {
  const filtered = readLocalArray(LOCAL_KEYS.CUSTOM_ACTIVITIES).filter((item) => item.id !== activityId);
  writeLocalArray(LOCAL_KEYS.CUSTOM_ACTIVITIES, filtered);
};

const getStoredExamDates = () => readLocalArray(LOCAL_KEYS.EXAM_DATES);

const setStoredExamDate = (subjectId, examDate, examTime, subjectTitle) => {
  const list = getStoredExamDates();
  const index = list.findIndex((item) => item.subjectId === subjectId);
  if (!examDate) {
    if (index >= 0) list.splice(index, 1);
    writeLocalArray(LOCAL_KEYS.EXAM_DATES, list);
    return { examDate: null, examTime: null };
  }
  const entry = { subjectId, subjectTitle: subjectTitle || null, examDate, examTime: examTime || null };
  if (index >= 0) list[index] = entry;
  else list.push(entry);
  writeLocalArray(LOCAL_KEYS.EXAM_DATES, list);
  return entry;
};

const getLocalPurchases = () => readLocalArray(LOCAL_KEYS.PURCHASES);
const addLocalPurchase = (resourceId) => {
  const list = getLocalPurchases();
  if (!list.includes(resourceId)) {
    list.push(resourceId);
    writeLocalArray(LOCAL_KEYS.PURCHASES, list);
  }
  return list;
};

const normalizeCourse = (course = {}) => ({
  id: course.id ?? course.curso_id ?? course.inscripcion_id ?? null,
  title: course.titulo || course.title || 'Curso',
  description: course.descripcion || course.description || '',
  professor: course.creador?.nombre_completo || course.creador?.name || course.profesor || 'Profesor asignado',
  school: course.categoria || course.school || 'General',
  level: course.nivel || course.level || 'General',
  progress: safeNumber(course.progreso_porcentaje ?? course.progress ?? 0, 0),
  examDate: course.examDate || null,
  examTime: course.examTime || null,
  temario: Array.isArray(course.modulos || course.temario)
    ? (course.modulos || course.temario).map((modulo) => ({
        id: modulo.id,
        title: modulo.titulo || modulo.title || 'Modulo',
        completed: Boolean(modulo.completado),
        resources: modulo.recursos || []
      }))
    : [],
  raw: course
});

const normalizeEnrollment = (inscription = {}) => {
  const course = normalizeCourse(inscription.curso || inscription);
  return {
    ...course,
    id: course.id || inscription.curso?.id || inscription.inscripcion_id || inscription.id,
    progress: safeNumber(inscription.progreso_porcentaje ?? course.progress ?? 0, 0),
    completed: Boolean(inscription.completado),
    inscriptionId: inscription.inscripcion_id || inscription.id || null,
    lastAccess: inscription.ultimo_acceso || null
  };
};

const normalizeDashboard = (payload = {}) => {
  const courses = Array.isArray(payload.mis_cursos) ? payload.mis_cursos.map(normalizeCourse) : [];
  const upcomingExams = Array.isArray(payload.proximos_examenes)
    ? payload.proximos_examenes.map((exam) => {
        const [datePart, timePart] = (exam.fecha_inicio || '').split('T');
        return {
          id: exam.id,
          title: exam.titulo || 'Examen',
          type: 'EXAMEN',
          date: datePart || null,
          time: timePart ? timePart.slice(0, 5) : null,
          origin: 'BACKEND',
          courseTitle: exam.curso || '',
          durationMinutes: safeNumber(exam.duracion_minutos, null)
        };
      })
    : [];
  return {
    courses,
    upcomingExams,
    recentActivity: payload.actividades_recientes || [],
    stats: payload.estadisticas || {}
  };
};

const resolveAuthorName = (resource = {}) => {
  if (resource.author) return resource.author;
  if (resource.autor_nombre) return resource.autor_nombre;
  if (resource.autor && typeof resource.autor === 'object') {
    const { name, username, first_name, last_name } = resource.autor;
    if (name) return name;
    if (first_name || last_name) {
      const full = `${first_name || ''} ${last_name || ''}`.trim();
      return full || username || 'Anonimo';
    }
    return username || 'Anonimo';
  }
  if (typeof resource.autor === 'string') return resource.autor;
  return 'Anonimo';
};

const normalizeResource = (resource = {}) => ({
  id: resource.id,
  title: resource.titulo || resource.title || 'Recurso',
  description: resource.descripcion || resource.description || '',
  subjectId: resource.curso || resource.curso_id || null,
  subjectName: resource.curso_titulo || resource.nombre_curso || resource.subjectName || 'General',
  author: resolveAuthorName(resource),
  type: (resource.tipo || resource.type || 'DOCUMENTO').toString().toLowerCase(),
  price: safeNumber(resource.precio ?? resource.price ?? 0, 0),
  rating: safeNumber(resource.calificacion_promedio ?? resource.rating ?? 0, 0),
  downloads: safeNumber(resource.descargas ?? resource.downloads ?? 0, 0),
  free: resource.es_gratuito ?? resource.free ?? (resource.precio === 0 || resource.price === 0),
  raw: resource
});

const normalizeCommunityResource = (resource = {}) => normalizeResource({
  ...resource,
  nombre_curso: resource.curso_titulo || resource.nombre_curso
});

const normalizeForumTopic = (topic = {}) => ({
  id: topic.id,
  title: topic.titulo || topic.title || 'Tema',
  subjectId: topic.curso || null,
  subjectName: topic.curso_titulo || topic.subjectName || 'General',
  postCount: topic.total_respuestas ?? (topic.respuestas ? topic.respuestas.length : 0),
  lastActivity: topic.ultima_actividad || topic.fecha_actualizacion || topic.fecha_creacion || null
});

const normalizeForumDetail = (topic = {}) => ({
  id: topic.id,
  title: topic.titulo || topic.title || 'Tema',
  subjectId: topic.curso || null,
  subjectName: topic.curso_titulo || topic.subjectName || 'General',
  posts: Array.isArray(topic.respuestas)
    ? topic.respuestas.map((reply) => ({
        id: reply.id,
        author: reply.autor?.username || reply.autor?.first_name || reply.autor?.last_name || 'Usuario',
        content: reply.contenido || reply.content || '',
        createdAt: reply.fecha_creacion || reply.createdAt,
        votes: reply.total_votos ?? reply.votes ?? 0
      }))
    : []
});

const normalizeQuestion = (question = {}) => ({
  id: question.id,
  text: question.texto_pregunta || question.text || '',
  optionA: question.opcion_a,
  optionB: question.opcion_b,
  optionC: question.opcion_c,
  optionD: question.opcion_d,
  answer: question.respuesta_correcta || question.answer || '',
  difficulty: question.dificultad || question.difficulty,
  points: safeNumber(question.puntos, 0)
});

const normalizeExamMetadata = (exam = {}) => ({
  id: exam.id,
  title: exam.titulo || exam.title || 'Examen',
  description: exam.descripcion || exam.description || '',
  duration: safeNumber(exam.duracion_minutos, 0) * 60,
  questionCount: safeNumber(exam.numero_preguntas, 0),
  minScore: safeNumber(exam.puntaje_minimo_aprobacion, 0),
  questions: Array.isArray(exam.questions) ? exam.questions.map(normalizeQuestion) : []
});

const normalizeExamStart = (examId, payload = {}, metadata = {}) => ({
  id: examId,
  title: metadata.titulo || metadata.title || payload.titulo || 'Examen',
  duration: safeNumber(payload.duracion_minutos ?? metadata.duracion_minutos, 0) * 60,
  attemptId: payload.intento_id,
  questions: Array.isArray(payload.preguntas) ? payload.preguntas.map(normalizeQuestion) : []
});

const normalizeFormulary = (formulary = {}) => ({
  id: formulary.id,
  title: formulary.titulo || formulary.title || 'Formulario',
  description: formulary.descripcion || formulary.description || '',
  type: formulary.tipo || formulary.type || 'ENCUESTA',
  subject: formulary.curso?.titulo || formulary.curso_titulo || formulary.subject || 'General',
  url: '#',
  raw: formulary
});

const examCatalog = new Map();
const activeExamAttempts = new Map();

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

const extractErrorMessage = (data) => {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (data.detail) return data.detail;
  const values = Object.values(data).flat().filter(Boolean);
  return values.length ? values.join(', ') : '';
};

const request = async (endpoint, method = 'GET', data = null, requiresAuth = true) => {
  if (isDemoMode()) {
    return DemoAPI.handle(endpoint, method, data);
  }

  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
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
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = extractErrorMessage(payload) || `Error ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = payload;
    if (response.status === 401) {
      try {
        localStorage.removeItem('authToken');
      } catch {
       }
    }
    throw error;
  }

  if (payload === null) {
    if (response.status === 204) return {};
    const text = await response.text().catch(() => '');
    return text ? { raw: text } : {};
  }
  return payload;
};

export const apiService = {
  async login(identifier, password) {
    const payload = { username: identifier, password };
    try {
      const raw = await request(API_CONFIG.ENDPOINTS.AUTH.LOGIN, 'POST', payload, false);
      if (raw?.token) {
        const user = formatUserForFrontend(raw.usuario || raw.user || raw);
        return { success: true, token: raw.token, user, message: raw.message };
      }
      return { success: false, message: extractErrorMessage(raw) || 'Respuesta inesperada del servidor' };
    } catch (error) {
      return { success: false, message: error.message || 'No se pudo iniciar sesion' };
    }
  },
  async register(userData) {
    try {
      const response = await request(API_CONFIG.ENDPOINTS.AUTH.REGISTER, 'POST', userData, false);
      if (response?.token) {
        const user = formatUserForFrontend(response.usuario || response.user || response);
        return { success: true, token: response.token, user, message: response.message };
      }
      return { success: true, message: response?.message || 'Registro exitoso' };
    } catch (error) {
      return { success: false, message: error.message || 'No se pudo registrar' };
    }
  },
  async logout() {
    if (isDemoMode()) return request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, 'POST');
    try {
      return await request(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, 'POST');
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  async getProfile() {
    const profile = await request(API_CONFIG.ENDPOINTS.USERS.GET_PROFILE);
    const user = formatUserForFrontend(profile);
    user.raw = profile;
    return user;
  },
  async getRole() {
    return request(API_CONFIG.ENDPOINTS.USERS.GET_ROLE);
  },
  async getDashboard() {
    const payload = await request(API_CONFIG.ENDPOINTS.USERS.GET_DASHBOARD);
    return normalizeDashboard(payload);
  },
  async getAllSubjects() {
    const raw = await request(API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL);
    const list = Array.isArray(raw) ? raw : raw?.results || raw?.cursos || [];
    return list.map(normalizeCourse);
  },
  async getUserSubjects() {
    const raw = await request(API_CONFIG.ENDPOINTS.SUBJECTS.GET_USER_SUBJECTS);
    if (!Array.isArray(raw)) return [];
    if (raw.length > 0 && raw[0]?.curso) {
      return raw.map(normalizeEnrollment);
    }
    return raw.map(normalizeCourse);
  },
  async searchCourses(query) {
    const term = (query || '').toString().trim();
    const endpoint = `${API_CONFIG.ENDPOINTS.SUBJECTS.SEARCH}?q=${encodeURIComponent(term)}`;
    const raw = await request(endpoint);
    const list = Array.isArray(raw?.cursos) ? raw.cursos : Array.isArray(raw) ? raw : [];
    return list.map(normalizeCourse);
  },
  async addSubject(subjectId) {
    const endpoint = `${API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL}${subjectId}/${API_CONFIG.ENDPOINTS.SUBJECTS.ENROLL_SUFFIX}`;
    return request(endpoint, 'POST', {});
  },
  async getCourseProgress(subjectId) {
    const endpoint = `${API_CONFIG.ENDPOINTS.SUBJECTS.GET_ALL}${subjectId}/${API_CONFIG.ENDPOINTS.SUBJECTS.PROGRESS_SUFFIX}`;
    return request(endpoint);
  },
  async getDetailedProgress() {
    return request(API_CONFIG.ENDPOINTS.USERS.GET_PROGRESS);
  },
  async updateExamDate(subjectId, examDate, examTime, subjectTitle) {
    if (isDemoMode()) {
      const payload = { subjectId, examDate, examTime };
      return request(API_CONFIG.ENDPOINTS.SUBJECTS.UPDATE_EXAM_DATE, 'PUT', payload);
    }
    return setStoredExamDate(subjectId, examDate || null, examTime || null, subjectTitle);
  },
  async getUpcomingActivities() {
    if (isDemoMode()) {
      return request(API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING);
    }
    try {
      const dashboard = await this.getDashboard();
      const manual = readLocalArray(LOCAL_KEYS.CUSTOM_ACTIVITIES);
      const examDates = getStoredExamDates().map((entry) => ({
        id: `exam-${entry.subjectId}`,
        title: entry.subjectTitle || 'Examen',
        type: 'EXAMEN',
        date: entry.examDate,
        time: entry.examTime || null,
        origin: 'FECHA_EXAMEN',
        courseId: entry.subjectId
      }));
      return [...dashboard.upcomingExams, ...examDates, ...manual];
    } catch (error) {
      console.error('upcoming activities error', error);
      return readLocalArray(LOCAL_KEYS.CUSTOM_ACTIVITIES);
    }
  },
  async createUpcomingActivity({ title, type, date, time }) {
    if (isDemoMode()) {
      return request(API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING, 'POST', {
        titulo: title,
        tipo: type,
        fecha: date,
        hora: time || null
      });
    }
    return addLocalActivity({
      title: title || 'Actividad',
      type: type || 'OTRO',
      date,
      time: time || null
    });
  },
  async deleteUpcomingActivity(activityId) {
    if (isDemoMode()) {
      return request(`${API_CONFIG.ENDPOINTS.ACTIVITIES.UPCOMING}${activityId}/`, 'DELETE');
    }
    removeLocalActivity(activityId);
    return { success: true };
  },
  async getAllResources() {
    const raw = await request(API_CONFIG.ENDPOINTS.RESOURCES.GET_ALL);
    const list = Array.isArray(raw) ? raw : raw?.results || [];
    return list.map(normalizeResource);
  },
  async getPurchasedResources() {
    if (isDemoMode()) {
      return request(API_CONFIG.ENDPOINTS.RESOURCES.GET_PURCHASED);
    }
    const ids = getLocalPurchases();
    const resources = await this.getAllResources().catch(() => []);
    return ids.map((id) => resources.find((item) => item.id === id) || { id });
  },
  async purchaseResource(resourceId) {
    if (isDemoMode()) {
      return request(API_CONFIG.ENDPOINTS.RESOURCES.PURCHASE, 'POST', { resourceId });
    }
    addLocalPurchase(resourceId);
    return { success: true };
  },
  async downloadResource(resourceId) {
    if (isDemoMode()) {
      return request(API_CONFIG.ENDPOINTS.RESOURCES.DOWNLOAD, 'POST', { resourceId });
    }
    return { success: true, resourceId };
  },
  async markResourceCompleted(resourceId, timeSpent = 15) {
    const endpoint = `${API_CONFIG.ENDPOINTS.RESOURCES.GET_ALL}${resourceId}/${API_CONFIG.ENDPOINTS.RESOURCES.MARK_COMPLETED_SUFFIX}`;
    return request(endpoint, 'POST', { tiempo_dedicado: timeSpent });
  },
  async getAllFormularies() {
    const raw = await request(API_CONFIG.ENDPOINTS.FORMULARIES.GET_ALL);
    const list = Array.isArray(raw) ? raw : raw?.results || [];
    return list.map(normalizeFormulary);
  },
  async getAllAchievements() {
    return request(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_ALL);
  },
  async getUserAchievements() {
    return request(API_CONFIG.ENDPOINTS.ACHIEVEMENTS.GET_USER_ACHIEVEMENTS);
  },
  async getAllExams() {
    const raw = await request(API_CONFIG.ENDPOINTS.EXAMS.GET_ALL);
    const list = Array.isArray(raw) ? raw : raw?.results || [];
    list.forEach((exam) => examCatalog.set(exam.id, exam));
    return list.map(normalizeExamMetadata);
  },
  async startExam(examId) {
    const endpoint = `${API_CONFIG.ENDPOINTS.EXAMS.GET_ALL}${examId}/${API_CONFIG.ENDPOINTS.EXAMS.START_SUFFIX}`;
    const payload = await request(endpoint, 'POST', {});
    const normalized = normalizeExamStart(examId, payload, examCatalog.get(examId) || {});
    if (normalized.attemptId) {
      activeExamAttempts.set(examId, normalized.attemptId);
    }
    return normalized;
  },
  async submitExam(examId, answers) {
    const attemptId = activeExamAttempts.get(examId);
    if (!attemptId) {
      throw new Error('Examen no iniciado. Inicia el examen antes de enviar respuestas.');
    }
    const respuestas = Object.entries(answers || {}).map(([questionId, value]) => ({
      pregunta_id: Number(questionId),
      respuesta: (value || '').toString().trim(),
      tiempo: 0
    }));
    const payload = {
      intento_id: attemptId,
      respuestas,
      tiempo_total: respuestas.length ? respuestas.length * 5 : 0
    };
    const endpoint = `${API_CONFIG.ENDPOINTS.EXAMS.GET_ALL}${examId}/${API_CONFIG.ENDPOINTS.EXAMS.SUBMIT_SUFFIX}`;
    const result = await request(endpoint, 'POST', payload);
    activeExamAttempts.delete(examId);
    return {
      calificacion: safeNumber(result.puntaje ?? result.calificacion ?? 0, 0),
      correctas: result.respuestas_correctas ?? result.correctas ?? 0,
      total: result.total_preguntas ?? result.total ?? respuestas.length,
      aprobado: result.aprobado,
      tiempo_usado: result.tiempo_usado
    };
  },
  async getAllTutors() {
    try {
      const data = await request(API_CONFIG.ENDPOINTS.TUTORS.GET_ALL);
      return Array.isArray(data) ? data : data?.results || [];
    } catch {
      return [];
    }
  },
  async scheduleTutoring(tutorId, subjectId, duration, topic) {
    return request(API_CONFIG.ENDPOINTS.TUTORS.SCHEDULE, 'POST', { tutorId, subjectId, duration, topic });
  },
  async getAllForums() {
    const data = await request(API_CONFIG.ENDPOINTS.FORUMS.GET_ALL);
    const list = Array.isArray(data) ? data : data?.results || [];
    return list.map(normalizeForumTopic);
  },
  async createForumTopic(topicData) {
    const payload = {
      titulo: topicData.title,
      contenido: topicData.content,
      categoria: topicData.category || 'PREGUNTA',
      curso: topicData.subjectId || null
    };
    const data = await request(API_CONFIG.ENDPOINTS.FORUMS.CREATE_TOPIC, 'POST', payload);
    return { success: true, topic: normalizeForumTopic(data) };
  },
  async getForumTopic(topicId) {
    const topic = await request(`${API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC}${topicId}/`);
    return normalizeForumDetail(topic);
  },
  async replyForumTopic(topicId, message) {
    return request(`${API_CONFIG.ENDPOINTS.FORUMS.GET_TOPIC}${topicId}/responder/`, 'POST', { contenido: message });
  },
  async voteAnswer(answerId, type = 'UP') {
    const response = await request(`${API_CONFIG.ENDPOINTS.FORUMS.VOTE_ANSWER}${answerId}/votar/`, 'POST', { tipo: type });
    return { success: true, votes: response.total_votos ?? response.votes ?? 0 };
  },
  async getUserNotifications() {
    if (isDemoMode()) {
      return request(API_CONFIG.ENDPOINTS.NOTIFICATIONS.GET_USER_NOTIFICATIONS);
    }
    return [];
  },
  async markNotificationAsRead(notificationId) {
    if (isDemoMode()) {
      return request(API_CONFIG.ENDPOINTS.NOTIFICATIONS.MARK_READ, 'POST', { notificationId });
    }
    return { success: true };
  },
  async getAllUsers() {
    try {
      const data = await request(API_CONFIG.ENDPOINTS.ADMIN.USERS);
      return Array.isArray(data) ? data.map(formatUserForFrontend) : [];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
  },
  async manageUser(userId, action, data = {}) {
    if (isDemoMode()) {
      return request(`${API_CONFIG.ENDPOINTS.ADMIN.USERS}/${userId}`, 'PUT', { action, ...data });
    }
    return { success: false, message: 'No disponible' };
  },
  async createSubject(subjectData) {
    if (isDemoMode()) {
      return request(API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS, 'POST', subjectData);
    }
    return { success: false, message: 'No disponible' };
  },
  async updateSubject(subjectId, subjectData) {
    if (isDemoMode()) {
      return request(`${API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS}/${subjectId}`, 'PUT', subjectData);
    }
    return { success: false, message: 'No disponible' };
  },
  async deleteSubject(subjectId) {
    if (isDemoMode()) {
      return request(`${API_CONFIG.ENDPOINTS.ADMIN.SUBJECTS}/${subjectId}`, 'DELETE');
    }
    return { success: false, message: 'No disponible' };
  },
  async createCommunityResource(resourceData) {
    const data = await request(API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE, 'POST', resourceData);
    return normalizeCommunityResource(data);
  },
  async getMyCommunityResources() {
    const data = await request(API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.MY_RESOURCES);
    const list = Array.isArray(data) ? data : data?.results || [];
    return list.map(normalizeCommunityResource);
  },
  async getCommunityResources(query = '', type = '') {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (type) params.append('tipo', type);
    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.SEARCH}?${queryString}`
      : API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE;
    const data = await request(endpoint);
    const list = Array.isArray(data) ? data : data?.results || [];
    return list.map(normalizeCommunityResource);
  },
  async downloadCommunityResource(resourceId) {
    const endpoint = `${API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE}${resourceId}/${API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.DOWNLOAD_SUFFIX}`;
    return request(endpoint, 'POST', {});
  },
  async rateCommunityResource(resourceId, rating, comment = '') {
    const endpoint = `${API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.BASE}${resourceId}/${API_CONFIG.ENDPOINTS.COMMUNITY_RESOURCES.RATE_SUFFIX}`;
    return request(endpoint, 'POST', { calificacion: rating, comentario: comment });
  }
};
