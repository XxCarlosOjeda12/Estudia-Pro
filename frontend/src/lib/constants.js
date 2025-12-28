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
      UPDATE_PROFILE: '/users/profile/', // Needs backend implementation check
      GET_DASHBOARD: '/mi-panel/',
      GET_PROGRESS: '/mi-progreso/',
      ACTIVATE_PREMIUM: '/auth/activate-premium/',
      TRACK_TIME: '/auth/track-time/'
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
      MARK_READ: '/notificaciones/leer/',
      DELETE: '/notificaciones/eliminar/',
      DELETE_ALL: '/notificaciones/eliminar-todas/'
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
  // Community resources are now loaded from /public/data/community-resources.json
  communityResources: [],
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
        },
        {
          id: 'q-4',
          text: 'Determina la derivada de $y = \\ln(x^2 + 1)$',
          answer: '\\frac{2x}{x^2+1}',
          explanation: 'Regla de la cadena: $\\frac{1}{u} \\cdot u\'$.',
          wolframQuery: 'derivative ln(x^2+1)'
        },
        {
          id: 'q-5',
          text: 'Encuentra la pendiente de la recta tangente a $f(x) = e^x$ en $x=0$',
          answer: '1',
          explanation: 'La derivada es $e^x$, evaluada en $0$ es $1$.',
          wolframQuery: 'slope of e^x at x=0'
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
          answer: '\\begin{pmatrix}1\\\\-1\\end{pmatrix}',
          explanation: 'Resuelve $(A-3I)v=0$.',
          wolframQuery: 'eigenvectors [[4,1],[0,3]]'
        },
        {
          id: 'alg-q3',
          text: 'Si $A$ es una matriz de $3\\times3$ y $\\det(A)=2$, ¿cuánto es $\\det(2A)$?',
          answer: '16',
          explanation: 'Propiedad: $\\det(kA) = k^n \\det(A)$ donde $n=3$. $2^3(2) = 16$.',
          wolframQuery: 'det(2A) for 3x3 matrix if det(A)=2'
        },
        {
          id: 'alg-q4',
          text: 'Calcula la traza de $B = \\begin{pmatrix} 1 & 0 & 5 \\\\ 0 & 2 & 0 \\\\ 3 & 4 & 1 \\end{pmatrix}$',
          answer: '4',
          explanation: 'Suma de la diagonal principal: $1 + 2 + 1 = 4$.',
          wolframQuery: 'trace {{1,0,5},{0,2,0},{3,4,1}}'
        },
        {
          id: 'alg-q5',
          text: '¿Son los vectores $v_1=(1,0), v_2=(0,1), v_3=(1,1)$ linealmente independientes?',
          answer: 'No',
          explanation: 'Tres vectores en $\\mathbb{R}^2$ siempre son dependientes ($v_3 = v_1 + v_2$).',
          wolframQuery: 'are (1,0), (0,1), (1,1) linearly independent'
        }
      ]
    },
    {
      id: 'exam-ecuaciones',
      subjectId: 'ecu-1',
      subjectName: 'Ecuaciones Diferenciales',
      title: 'Simulacro Ecuaciones Orden 1',
      duration: 3000,
      questions: [
        {
          id: 'ecu-q1',
          text: 'Resuelve la ecuación separable $y\' = y$',
          answer: 'y = Ce^x',
          explanation: 'Separando variables $\\frac{dy}{y} = dx \\implies \\ln|y| = x + C$.',
          wolframQuery: 'solve y\' = y'
        },
        {
          id: 'ecu-q2',
          text: '¿Cuál es el factor integrante para $y\' + \\frac{1}{x}y = x$?',
          answer: 'x',
          explanation: '$\\mu(x) = e^{\\int (1/x) dx} = e^{\\ln x} = x$.',
          wolframQuery: 'integrating factor y\' + y/x = x'
        },
        {
          id: 'ecu-q3',
          text: 'Transformada de Laplace de $f(t) = 1$',
          answer: '\\frac{1}{s}',
          explanation: 'Definición: $\\int_0^\\infty e^{-st} dt = 1/s$.',
          wolframQuery: 'Laplace transform of 1'
        },
        {
          id: 'ecu-q4',
          text: 'Determina el orden de la ecuación $y\'\' + (y\')^3 = x$',
          answer: '2',
          explanation: 'El orden es la derivada más alta, que es $y\'\'$.',
          wolframQuery: 'order of y\'\' + (y\')^3 = x'
        },
        {
          id: 'ecu-q5',
          text: 'Solución general de $y\'\' - y = 0$',
          answer: 'y = C_1 e^x + C_2 e^{-x}',
          explanation: 'Ecuación característica $r^2 - 1 = 0 \\implies r = \\pm 1$.',
          wolframQuery: 'solve y\'\' - y = 0'
        }
      ]
    },
    {
      id: 'exam-probabilidad',
      subjectId: 'prob-1',
      subjectName: 'Probabilidad y Estadística',
      title: 'Simulacro Probabilidad Básica',
      duration: 2400,
      questions: [
        {
          id: 'prob-q1',
          text: 'Calcula $\\binom{5}{2}$',
          answer: '10',
          explanation: 'Combinaciones: $\\frac{5!}{2!(5-2)!} = \\frac{120}{2 \\cdot 6} = 10$.',
          wolframQuery: '5 choose 2'
        },
        {
          id: 'prob-q2',
          text: 'Probabilidad de obtener "Cara" al lanzar una moneda justa',
          answer: '0.5',
          explanation: 'Casos favorables (1) / Casos totales (2).',
          wolframQuery: 'probability of heads'
        },
        {
          id: 'prob-q3',
          text: 'Si $P(A)=0.3, P(B)=0.4$ y son independientes, halla $P(A \\cap B)$',
          answer: '0.12',
          explanation: 'Independencia implica $P(A \\cap B) = P(A)P(B) = (0.3)(0.4)$.',
          wolframQuery: '0.3 * 0.4'
        },
        {
          id: 'prob-q4',
          text: '¿Cuál es la media de una distribución normal estándar $Z$?',
          answer: '0',
          explanation: 'Por definición, $N(0, 1)$ tiene media 0.',
          wolframQuery: 'mean of standard normal distribution'
        },
        {
          id: 'prob-q5',
          text: 'Permutaciones de las letras de la palabra "SOL"',
          answer: '6',
          explanation: '$3! = 3 \\times 2 \\times 1 = 6$.',
          wolframQuery: 'permutations of SOL'
        }
      ]
    }
  ],
  // Formularies are now loaded from /public/data/formularies.json
  formularies: [],
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
        { id: 'post-2', author: 'Ana García (Mentora)', content: 'Utiliza división sintética dos veces, luego factoriza el resultado cuadrático.', createdAt: '2024-05-23T12:20:00Z', votes: 12 },
        { id: 'post-new-1', author: 'Ian Salazar', content: 'También puedes graficarlo rápido en W.Alpha para encontrar una raíz entera y bajarle el grado.', createdAt: '2024-05-23T13:45:00Z', votes: 4 }
      ]
    },
    {
      id: 'forum-2',
      title: 'Tips para dominar integrales por partes',
      subjectName: 'Cálculo Diferencial',
      posts: [
        { id: 'post-3', author: 'Daniela Y.', content: '¿Algún truco para recordar qué elegir como u y dv?', createdAt: '2024-05-22T18:10:00Z', votes: 5 },
        { id: 'post-4', author: 'Ian Salazar', content: 'Aplica LIATE y practica con integrales de logaritmos. Arma una tabla rápida.', createdAt: '2024-05-22T19:05:00Z', votes: 8 },
        { id: 'post-new-2', author: 'Prof. Sofía', content: 'Recuerda: si tienes e^x y sen(x), es cíclica. Tienes que integrar dos veces y despejar.', createdAt: '2024-05-23T09:10:00Z', votes: 10 }
      ]
    },
    {
      id: 'forum-3',
      title: '¿Cómo iniciar con ecuaciones diferenciales?',
      subjectName: 'Ecuaciones Diferenciales',
      posts: [
        { id: 'post-5', author: 'Sofía', content: '¿Recomiendan empezar por separables o por factor integrante?', createdAt: '2024-05-21T07:45:00Z' },
        { id: 'post-6', author: 'Monitor IA', content: 'Empieza con separables y exactas, después pasa a coeficientes constantes.', createdAt: '2024-05-21T08:30:00Z' },
        { id: 'post-new-3', author: 'Carlos T.', content: 'Ojo con las EDOs exactas, revisa siempre que My = Nx antes de integrar.', createdAt: '2024-05-21T10:20:00Z', votes: 3 }
      ]
    },
    {
      id: 'forum-4',
      title: 'Duda sobre Teorema de Bayes',
      subjectName: 'Probabilidad y Estadística',
      posts: [
        { id: 'post-7', author: 'Kevin M.', content: 'No entiendo cuándo el denominador es la suma de probabilidades totales. ayuda :(', createdAt: '2024-05-24T09:00:00Z', votes: 1 },
        { id: 'post-8', author: 'Ian Salazar', content: 'Piensa en el denominador como "todos los casos posibles" de que ocurra el evento B. Suma P(B|Ai)P(Ai).', createdAt: '2024-05-24T10:15:00Z', votes: 6 }
      ]
    },
    {
      id: 'forum-5',
      title: 'Matriz Inversa - Método de Gauss-Jordan',
      subjectName: 'Álgebra Lineal Avanzada',
      posts: [
        { id: 'post-9', author: 'Luisa F.', content: '¿Qué pasa si al escalar la matriz me queda una fila de ceros?', createdAt: '2024-05-20T14:20:00Z', votes: 3 },
        { id: 'post-10', author: 'Mtro. Armando', content: 'Si obtienes una fila de ceros en la parte izquierda, la matriz NO tiene inversa (es singular).', createdAt: '2024-05-20T16:45:00Z', votes: 15 }
      ]
    }
  ],
  achievements: [
    { id: 'ach-1', title: 'Primer Sprint', description: 'Completaste tu primera semana estudiando diario.', icon: '🚀', date: '2024-05-10' },
    { id: 'ach-2', title: 'Explorador', description: 'Agregaste 3 materias a tu panel.', icon: '🧭', date: '2024-05-14' },
    { id: 'ach-3', title: 'SOS Master', description: 'Agendaste 2 tutorías en un mes.', icon: '🧑‍🏫', date: '2024-05-18' }
  ],
  adminUsers: [
    { id: 'demo-1', name: 'Daniela Yáñez', email: 'daniela@estudiapro.com', role: 'ESTUDIANTE', verified: true },
    { id: 'demo-creator', name: 'Ana García', email: 'ana@estudiapro.com', role: 'CREADOR', verified: true },
    { id: 'demo-ale', name: 'Alejandra Ruiz', email: 'alejandra@estudiapro.com', role: 'CREADOR', verified: true },
    { id: 'demo-ian', name: 'Ian Salazar', email: 'ian@estudiapro.com', role: 'CREADOR', verified: true },
    { id: 'demo-rosa', name: 'Rosa Vera', email: 'rosa@estudiapro.com', role: 'CREADOR', verified: true },
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
  },
  // New Real Tutor Profiles
  alejandra: {
    id: 'demo-ale',
    username: 'alejandra',
    email: 'alejandra@estudiapro.com',
    password: 'demo123',
    first_name: 'Alejandra',
    last_name: 'Ruiz',
    name: 'Alejandra Ruiz',
    rol: 'CREADOR',
    foto_perfil_url: '',
    nivel: 8,
    puntos_gamificacion: 3400,
    streak: 45,
    notifications: [],
    dashboard: {
      published: 12,
      rating: 4.9,
      studentsHelped: 128,
      tutoring: []
    },
    tutorProfile: {
      specialties: 'Cálculo, Álgebra',
      bio: 'Coach académica con 6 años ayudando a pasar extraordinarios.',
      active: true,
      tariff30: 180,
      tariff60: 320
    }
  },
  ian: {
    id: 'demo-ian',
    username: 'ian',
    email: 'ian@estudiapro.com',
    password: 'demo123',
    first_name: 'Ian',
    last_name: 'Salazar',
    name: 'Ian Salazar',
    rol: 'CREADOR',
    foto_perfil_url: '',
    nivel: 6,
    puntos_gamificacion: 2100,
    streak: 20,
    notifications: [],
    dashboard: {
      published: 8,
      rating: 4.7,
      studentsHelped: 86,
      tutoring: []
    },
    tutorProfile: {
      specialties: 'Probabilidad, Estadística',
      bio: 'Te ayudo a traducir problemas de datos a pasos simples.',
      active: true,
      tariff30: 160,
      tariff60: 290
    }
  },
  rosa: {
    id: 'demo-rosa',
    username: 'rosa',
    email: 'rosa@estudiapro.com',
    password: 'demo123',
    first_name: 'Rosa',
    last_name: 'Vera',
    name: 'Rosa Vera',
    rol: 'CREADOR',
    foto_perfil_url: '',
    nivel: 7,
    puntos_gamificacion: 2800,
    streak: 32,
    notifications: [],
    dashboard: {
      published: 15,
      rating: 4.8,
      studentsHelped: 102,
      tutoring: []
    },
    tutorProfile: {
      specialties: 'Ecuaciones Diferenciales',
      bio: 'Explico con gráficas interactivas y ejemplos reales.',
      active: true,
      tariff30: 200,
      tariff60: 340
    }
  }
};

HARDCODED_DATA.demoUsers = DEMO_PROFILES;
HARDCODED_DATA.demoUsersList = Object.values(DEMO_PROFILES);
