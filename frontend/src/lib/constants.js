export const API_CONFIG = {
  BASE_URL: (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, ''),
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login/',
      REGISTER: '/auth/register/',
      VERIFY: '/auth/verify/',
      LOGOUT: '/auth/logout/'
    },
    USERS: {
      GET_PROFILE: '/auth/profile/',
      UPDATE_PROFILE: '/users/profile/',
      GET_DASHBOARD: '/mi-panel/',
      GET_PROGRESS: '/mi-progreso/'
    },
    SUBJECTS: {
      GET_ALL: '/cursos/',
      GET_USER_SUBJECTS: '/mis-cursos/',
      ADD_SUBJECT: '/mis-cursos/inscribir/', // Assuming enrollment endpoint
      UPDATE_EXAM_DATE: '/mis-cursos/fecha-examen/'
    },
    RESOURCES: {
      GET_ALL: '/recursos/',
      GET_PURCHASED: '/recursos/mis-compras/',
      PURCHASE: '/recursos/comprar/',
      DOWNLOAD: '/recursos/descargar/',
      MARK_COMPLETED: '/marcar_completado/' // Suffix for /recursos/{id}/...
    },
    EXAMS: {
      GET_ALL: '/examenes/',
      START_EXAM: '/examenes/iniciar/',
      SUBMIT_EXAM: '/examenes/enviar/'
    },
    TUTORS: {
      GET_ALL: '/tutores/',
      ME: '/tutores/me/',
      SCHEDULE: '/tutores/agendar/'
    },
    FORUMS: {
      GET_ALL: '/foro/',
      CREATE_TOPIC: '/foro/', // Backend expects POST /api/foro/
      GET_TOPIC: '/foro/' // Used as base for /foro/{id}/
    },
    ACHIEVEMENTS: {
      GET_USER_ACHIEVEMENTS: '/mis-logros/',
      GET_ALL: '/logros/'
    },
    NOTIFICATIONS: {
      GET_USER_NOTIFICATIONS: '/notificaciones/',
      MARK_READ: '/notificaciones/leer/'
    },
    ACTIVITIES: {
      UPCOMING: '/proximas-actividades/'
    },
    ADMIN: {
      USERS: '/admin/users/',
      SUBJECTS: '/admin/custom/cursos/',
      RESOURCES: '/admin/custom/recursos/'
    },
    FORMULARIES: {
      GET_ALL: '/formularios-estudio/'
    },
    COMMUNITY_RESOURCES: {
      BASE: '/recursos-comunidad/',
      MY_RESOURCES: '/recursos-comunidad/mis_recursos/',
      SEARCH: '/recursos-comunidad/buscar/' // Correct as per backend code
    }
  }
};

export const HARDCODED_DATA = {
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
    },
    {
      id: 'res-005',
      title: 'Kit visual para derivadas complicadas',
      author: 'Ana García',
      subjectId: 'calc-1',
      subjectName: 'Cálculo Diferencial',
      type: 'pdf',
      price: 149,
      rating: 4.9,
      downloads: 210,
      free: false,
      sales: 42
    },
    {
      id: 'res-006',
      title: 'Banco premium de integrales por partes',
      author: 'Ana García',
      subjectId: 'calc-1',
      subjectName: 'Cálculo Diferencial',
      type: 'exam',
      price: 189,
      rating: 4.8,
      downloads: 156,
      free: false,
      sales: 35
    }
  ],
  communityResources: [
    {
      id: 'community-001',
      titulo: 'Formulario de Integrales (Comunidad)',
      descripcion: 'Compendio rápido de fórmulas y ejemplos para integrales.',
      tipo: 'DOCUMENTO',
      archivo_url: 'demo/recurso-integrales.pdf',
      contenido_texto: '',
      autor: { id: 'demo-author-1', username: 'andrea', first_name: 'Andrea', last_name: 'Ríos', foto_perfil_url: null },
      autor_id: 'demo-author-1',
      curso_titulo: 'Cálculo Diferencial',
      fecha_creacion: '2024-05-23T15:45:00Z',
      descargas: 312,
      calificacion_promedio: 4.7,
      aprobado: true,
      activo: true
    },
    {
      id: 'community-002',
      titulo: 'Matrices: resumen de operaciones',
      descripcion: 'Apuntes con propiedades, determinantes y ejemplos.',
      tipo: 'DOCUMENTO',
      archivo_url: 'demo/recurso-matrices.pdf',
      contenido_texto: '',
      autor: { id: 'demo-author-2', username: 'carlos', first_name: 'Carlos', last_name: 'Trejo', foto_perfil_url: null },
      autor_id: 'demo-author-2',
      curso_titulo: 'Álgebra Lineal Avanzada',
      fecha_creacion: '2024-05-20T10:20:00Z',
      descargas: 178,
      calificacion_promedio: 4.8,
      aprobado: true,
      activo: true
    },
    {
      id: 'community-003',
      titulo: 'Probabilidad: distribuciones clásicas',
      descripcion: 'Guía rápida de binomial, geométrica, Poisson y normal.',
      tipo: 'DOCUMENTO',
      archivo_url: 'demo/recurso-probabilidad.pdf',
      contenido_texto: '',
      autor: { id: 'demo-author-3', username: 'ian', first_name: 'Ian', last_name: 'Salazar', foto_perfil_url: null },
      autor_id: 'demo-author-3',
      curso_titulo: 'Probabilidad y Estadística',
      fecha_creacion: '2024-05-19T09:10:00Z',
      descargas: 245,
      calificacion_promedio: 4.6,
      aprobado: true,
      activo: true
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
          text: 'Calcula la derivada de $f(x) = 3x^4 - 5x^2 + 2$',
          answer: '12x^3-10x',
          explanation: 'Aplica la regla del poder a cada término.',
          wolframQuery: 'derivative 3x^4-5x^2+2'
        },
        {
          id: 'q-2',
          text: 'Evalúa la integral $\\int_0^1 2x \\; dx$',
          answer: '1',
          explanation: 'La antiderivada de 2x es x^2. Evalúa entre 0 y 1.',
          wolframQuery: 'integrate 2x from 0 to 1'
        },
        {
          id: 'q-3',
          text: 'Resuelve el límite $\\lim_{x \\to 0} \\frac{\\sin(3x)}{x}$',
          answer: '3',
          explanation: 'Usa el límite notable sin(x)/x = 1.',
          wolframQuery: 'limit sin(3x)/x as x->0'
        }
      ]
    },
    {
      id: 'exam-algebra',
      subjectId: 'alg-2',
      subjectName: 'Álgebra Lineal Avanzada',
      title: 'Simulacro Matrices y Determinantes',
      duration: 2700,
      questions: [
        {
          id: 'alg-q1',
          text: 'Calcula el determinante de la matriz $$\\begin{vmatrix}2 & 3\\\\1 & 4\\end{vmatrix}$$',
          answer: '5',
          explanation: 'det(A)=ad-bc = (2)(4)-(3)(1).',
          wolframQuery: 'determinant [[2,3],[1,4]]'
        },
        {
          id: 'alg-q2',
          text: '¿Cuál es el vector propio asociado a $\\lambda=3$ de la matriz $A = \\begin{pmatrix}4 & 1\\\\0 & 3\\end{pmatrix}$?',
          answer: '\\begin{pmatrix}0\\\\1\\end{pmatrix}',
          explanation: 'Resuelve (A-3I)v=0.',
          wolframQuery: 'eigenvectors [[4,1],[0,3]]'
        }
      ]
    }
  ],
  formularies: [
    { id: 'form-1', title: 'Tabla de Derivadas', subject: 'Cálculo', type: 'PDF', url: 'demo/formulario-derivadas.pdf' },
    { id: 'form-2', title: 'Identidades Trigonométricas', subject: 'Álgebra', type: 'PDF', url: 'demo/formulario-trigonometria.pdf' },
    { id: 'form-3', title: 'Formulario de Laplace', subject: 'Ecuaciones Diferenciales', type: 'PDF', url: 'demo/formulario-laplace.pdf' }
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
      posts: [
        { id: 'post-1', author: 'Carlos T.', content: 'Estoy atascado en la parte donde debo eliminar una raíz repetida.', createdAt: '2024-05-23T11:15:00Z', votes: 2 },
        { id: 'post-2', author: 'Ana García (Mentora)', content: 'Utiliza división sintética dos veces, luego factoriza el resultado cuadrático.', createdAt: '2024-05-23T12:20:00Z', votes: 12 }
      ]
    },
    {
      id: 'forum-2',
      title: 'Tips para dominar integrales por partes',
      subjectName: 'Cálculo Diferencial',
      posts: [
        { id: 'post-3', author: 'Daniela Y.', content: '¿Algún truco para recordar qué elegir como u y dv?', createdAt: '2024-05-22T18:10:00Z', votes: 5 },
        { id: 'post-4', author: 'Ian Salazar', content: 'Aplica LIATE y practica con integrales de logaritmos. Arma una tabla rápida.', createdAt: '2024-05-22T19:05:00Z', votes: 8 }
      ]
    },
    {
      id: 'forum-3',
      title: '¿Cómo iniciar con ecuaciones diferenciales?',
      subjectName: 'Ecuaciones Diferenciales',
      posts: [
        { id: 'post-5', author: 'Sofía', content: '¿Recomiendan empezar por separables o por factor integrante?', createdAt: '2024-05-21T07:45:00Z' },
        { id: 'post-6', author: 'Monitor IA', content: 'Empieza con separables y exactas, después pasa a coeficientes constantes.', createdAt: '2024-05-21T08:30:00Z' }
      ]
    }
  ],
  achievements: [
    { id: 'ach-1', title: 'Primer Sprint', description: 'Completaste tu primera semana estudiando diario.', icon: '🚀', date: '2024-05-10' },
    { id: 'ach-2', title: 'Explorador', description: 'Agregaste 3 materias a tu panel.', icon: '🧭', date: '2024-05-14' },
    { id: 'ach-3', title: 'SOS Master', description: 'Agendaste 2 tutorías en un mes.', icon: '🧑‍🏫', date: '2024-05-18' }
  ],
  adminUsers: [
    { id: 'usr-001', name: 'Daniela Yáñez', email: 'daniela@estudiapro.com', role: 'ESTUDIANTE', verified: true },
    { id: 'usr-002', name: 'Ana García', email: 'ana@estudiapro.com', role: 'CREADOR', verified: true },
    { id: 'usr-003', name: 'Luis Hernández', email: 'luis@estudiapro.com', role: 'ESTUDIANTE', verified: false },
    { id: 'usr-004', name: 'María Torres', email: 'maria@estudiapro.com', role: 'ADMINISTRADOR', verified: true }
  ]
};

export const DEMO_PROFILES = {
  estudiante: {
    id: 'demo-1',
    username: 'estudiante.demo',
    email: 'demo@estudiapro.com',
    password: 'demo123',
    first_name: 'Daniela',
    last_name: 'Yáñez',
    name: 'Daniela Yáñez',
    rol: 'ESTUDIANTE',
    foto_perfil_url: '',
    nivel: 3,
    puntos_gamificacion: 820,
    streak: 6,
    subjects: HARDCODED_DATA.userSubjects,
    notifications: HARDCODED_DATA.notifications,
    purchasedResources: [...HARDCODED_DATA.purchasedResourceIds],
    stats: {
      level: 3,
      points: 820,
      streak: 6
    }
  },
  creador: {
    id: 'demo-creator',
    username: 'creador.demo',
    email: 'creador@estudiapro.com',
    password: 'demo123',
    first_name: 'Ana',
    last_name: 'García',
    name: 'Ana García',
    rol: 'CREADOR',
    foto_perfil_url: '',
    nivel: 5,
    puntos_gamificacion: 1500,
    streak: 12,
    notifications: [
      { id: 'notif-c1', title: 'Nueva venta', message: 'Joshua compró tu Guía de Derivadas.', type: 'success', read: false, date: '2024-05-24T11:30:00Z' },
      { id: 'notif-c2', title: 'Solicitud de tutoría', message: 'Luisa solicitó una tutoría de Álgebra para mañana.', type: 'alert', read: false, date: '2024-05-24T09:15:00Z' }
    ],
    dashboard: {
      published: HARDCODED_DATA.resources.filter(res => res.author === 'Ana García').length,
      rating: 4.7,
      studentsHelped: 94,
      tutoring: [
        { id: 'tut-1', student: 'Diego L.', subject: 'Cálculo Diferencial', date: '25 mayo - 18:00', duration: '60 min' },
        { id: 'tut-2', student: 'María J.', subject: 'Álgebra Lineal', date: '27 mayo - 10:00', duration: '45 min' }
      ]
    }
  },
  administrador: {
    id: 'demo-admin',
    username: 'admin.demo',
    email: 'admin@estudiapro.com',
    password: 'demo123',
    first_name: 'Administrador',
    last_name: 'General',
    name: 'Administrador General',
    rol: 'ADMINISTRADOR',
    foto_perfil_url: '',
    nivel: 6,
    puntos_gamificacion: 2000,
    notifications: [
      { id: 'notif-a1', title: 'Nuevo registro', message: 'Se creó la cuenta de creador Ana García.', type: 'info', read: true, date: '2024-05-22T10:40:00Z' }
    ],
    adminMetrics: {
      users: HARDCODED_DATA.adminUsers.length,
      subjects: HARDCODED_DATA.subjectsCatalog.length,
      resources: HARDCODED_DATA.resources.length
    }
  }
};

HARDCODED_DATA.demoUsers = DEMO_PROFILES;
HARDCODED_DATA.demoUsersList = Object.values(DEMO_PROFILES);
