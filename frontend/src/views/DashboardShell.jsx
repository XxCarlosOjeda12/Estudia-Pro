import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import { apiService } from '../lib/api.js';
import PanelStudent from './pages/PanelStudent.jsx';
import PanelCreator from './pages/PanelCreator.jsx';
import PanelAdmin from './pages/PanelAdmin.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import MateriaPage from './pages/MateriaPage.jsx';
import RecursosPage from './pages/RecursosPage.jsx';
import ForoPage from './pages/ForoPage.jsx';
import ForoTemaPage from './pages/ForoTemaPage.jsx';
import FormulariosPage from './pages/FormulariosPage.jsx';
import ProgresoPage from './pages/ProgresoPage.jsx';
import ExamenPage from './pages/ExamenPage.jsx';
import SimuladorPage from './pages/SimuladorPage.jsx';
import MisRecursosPage from './pages/MisRecursosPage.jsx';
import TutoriasPage from './pages/TutoriasPage.jsx';
import GestionUsuariosPage from './pages/GestionUsuariosPage.jsx';
import GestionMateriasPage from './pages/GestionMateriasPage.jsx';

const DashboardShell = () => {
  const { user, logout, refreshNotifications, notifications, pushToast } = useAppContext();
  const [currentPage, setCurrentPage] = useState('panel');
  const [subjects, setSubjects] = useState([]);
  const [userSubjects, setUserSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [purchasedResources, setPurchasedResources] = useState([]);
  const [forums, setForums] = useState([]);
  const [currentForumTopic, setCurrentForumTopic] = useState(null);
  const [formularies, setFormularies] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [exams, setExams] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [currentExam, setCurrentExam] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleMarkRead = async (id) => {
    await apiService.markNotificationAsRead(id);
    await refreshNotifications();
  };

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      root.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [darkMode]);

  useEffect(() => {
    const bootstrap = async () => {
      const results = await Promise.allSettled([
        apiService.getAllSubjects(),
        apiService.getAllResources(),
        apiService.getCommunityResources(), // Fetch approved community resources
        apiService.getAllExams(),
        apiService.getAllForums(),
        apiService.getAllFormularies(),
        apiService.getAllTutors()
      ]);

      const subjectsData = results[0].status === 'fulfilled' ? results[0].value : [];
      const resourcesData = results[1].status === 'fulfilled' ? results[1].value : [];
      const communityResourcesData = results[2].status === 'fulfilled' ? results[2].value : [];
      const examsData = results[3].status === 'fulfilled' ? results[3].value : [];
      const forumsData = results[4].status === 'fulfilled' ? results[4].value : [];
      const formulariesData = results[5].status === 'fulfilled' ? results[5].value : [];
      const tutorsData = []; // Mock empty for now due to 404

      if (results[2].status === 'rejected') console.error('Community Resources Error:', results[2].reason);

      // Normalize resources to match UI expectations (handle backend/frontend field mismatches)
      const normalizeResource = (res) => {
        let authorName = 'Anónimo';
        if (typeof res.author === 'string') authorName = res.author;
        else if (typeof res.autor_nombre === 'string') authorName = res.autor_nombre;
        else if (res.autor && typeof res.autor === 'object') {
          // Handle Django User Serializer object
          const { first_name, last_name, username, name } = res.autor;
          if (name) authorName = name;
          else if (first_name || last_name) authorName = `${first_name || ''} ${last_name || ''}`.trim();
          else authorName = username || 'Anónimo';
        } else if (typeof res.autor === 'string') {
          authorName = res.autor;
        }

        return {
          ...res,
          id: res.id,
          title: res.title || res.titulo || 'Sin título',
          description: res.description || res.descripcion || '',
          subjectName: res.subjectName || res.nombre_curso || res.curso_nombre || 'General',
          author: authorName,
          type: (res.type || res.tipo || 'DOCUMENTO').toLowerCase(),
          price: res.price || res.precio || 0,
          rating: res.rating || res.calificacion_promedio || 0,
          downloads: res.downloads || res.descargas || 0,
          free: res.hasOwnProperty('free') ? res.free : (res.es_gratuito || res.precio === 0)
        };
      };

      const allResources = [
        ...resourcesData.map(normalizeResource),
        ...communityResourcesData.map(normalizeResource)
      ];

      console.log('Normalized Combined Resources:', allResources);

      setSubjects(subjectsData);
      setResources(allResources);
      setExams(examsData);
      setForums(forumsData);
      setFormularies(formulariesData);
      setTutors(tutorsData);
      if (user?.role === 'estudiante') {
        const [studentSubjects, purchased] = await Promise.all([
          apiService.getUserSubjects(),
          apiService.getPurchasedResources()
        ]);
        setUserSubjects(studentSubjects);
        setPurchasedResources(purchased);
      } else {
        setUserSubjects([]);
        setPurchasedResources([]);
      }
      if (user?.role === 'administrador') {
        const data = await apiService.getAllUsers();
        setAdminUsers(data);
      } else {
        setAdminUsers([]);
      }
      await refreshNotifications();
    };
    bootstrap().catch((error) => console.error('Bootstrap Error:', error));
  }, [user, refreshNotifications]);

  // Icons defined as simple SVG components for minimalist look
  const Icons = {
    Dashboard: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
    Search: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
    Users: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    Chat: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
    Document: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    Chart: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>,
    Tutor: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>,
    Settings: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  };

  const navItems = useMemo(() => {
    if (user?.role === 'administrador') {
      return [
        { id: 'panel', name: 'Panel General', icon: Icons.Dashboard },
        { id: 'gestion-usuarios', name: 'Usuarios', icon: Icons.Users },
        { id: 'gestion-materias', name: 'Gestión Materias', icon: Icons.Settings }
      ];
    }
    if (user?.role === 'creador') {
      return [
        { id: 'panel', name: 'Mi Panel', icon: Icons.Dashboard },
        { id: 'mis-recursos', name: 'Mis Recursos', icon: Icons.Document },
        { id: 'tutorias', name: 'Mis Tutorías', icon: Icons.Tutor },
        { id: 'foro', name: 'Foro de Ayuda', icon: Icons.Chat }
      ];
    }
    // Estudiante por defecto
    return [
      { id: 'panel', name: 'Mi Panel', icon: Icons.Dashboard },
      { id: 'explorar', name: 'Explorar Materias', icon: Icons.Search },
      { id: 'recursos', name: 'Recursos Comunidad', icon: Icons.Users },
      { id: 'foro', name: 'Foro de Ayuda', icon: Icons.Chat },
      { id: 'formularios', name: 'Formularios', icon: Icons.Document },
      { id: 'progreso', name: 'Mi Progreso', icon: Icons.Chart },
      { id: 'tutorias', name: 'Tutorías SOS', icon: Icons.Tutor }
    ];
  }, [user]);

  useEffect(() => {
    // Mantén páginas internas especiales, pero corrige si la página actual no pertenece al rol
    const safePages = ['materia', 'examen', 'simulador', 'foro-tema'];
    if (safePages.includes(currentPage)) return;
    if (navItems.every((item) => item.id !== currentPage)) {
      setCurrentPage(navItems[0]?.id || 'panel');
    }
  }, [navItems, currentPage]);

  const navigateTo = async (page, context = {}) => {
    setCurrentPage(page);
    if (page === 'materia' || page === 'simulador') {
      const subjectId = context.subjectId || currentSubject?.id || userSubjects[0]?.id;
      const subject = subjects.find((item) => item.id === subjectId) || userSubjects.find((item) => item.id === subjectId);
      setCurrentSubject(subject || null);
    }
    if (page === 'examen') {
      const examId = context.examId || exams[0]?.id;
      const exam = exams.find((item) => item.id === examId) || null;
      setCurrentExam(exam);
    }
    if (page === 'foro-tema' && context.forumId) {
      const topic = await apiService.getForumTopic(context.forumId);
      setCurrentForumTopic(topic);
    }
    setMobileMenu(false);
  };

  const handleAddSubject = async (subjectId) => {
    try {
      await apiService.addSubject(subjectId);
      const studentSubjects = await apiService.getUserSubjects();
      setUserSubjects(studentSubjects);
      pushToast({ title: 'Materias', message: 'Se añadió la materia.', type: 'success' });
    } catch {
      pushToast({ title: 'Materias', message: 'No se pudo añadir la materia.', type: 'alert' });
    }
  };

  const handlePurchaseResource = async (resourceId) => {
    try {
      await apiService.purchaseResource(resourceId);
      const purchased = await apiService.getPurchasedResources();
      setPurchasedResources(purchased);
      pushToast({ title: 'Recursos', message: 'Recurso añadido a tu biblioteca.', type: 'success' });
    } catch {
      pushToast({ title: 'Recursos', message: 'No se pudo completar la compra.', type: 'alert' });
    }
  };

  const handleTopicCreated = (topic) => {
    setForums((prev) => [topic, ...prev]);
  };

  const handleReplyTopic = async (topicId, message) => {
    await apiService.replyForumTopic(topicId, message);
    const updated = await apiService.getForumTopic(topicId);
    setCurrentForumTopic(updated);
  };

  const handleDeleteUser = async (userId) => {
    await apiService.manageUser(userId, 'delete');
    setAdminUsers((prev) => prev.filter((user) => user.id !== userId));
    pushToast({ title: 'Usuarios', message: 'Usuario eliminado.', type: 'success' });
  };

  const handleCreateSubject = async (payload) => {
    const response = await apiService.createSubject(payload);
    if (response?.subject) {
      setSubjects((prev) => [...prev, response.subject]);
      pushToast({ title: 'Materias', message: 'Materia agregada.', type: 'success' });
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    await apiService.deleteSubject(subjectId);
    setSubjects((prev) => prev.filter((subject) => subject.id !== subjectId));
    pushToast({ title: 'Materias', message: 'Materia eliminada.', type: 'success' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'panel':
        if (user?.role === 'creador') {
          return <PanelCreator resources={resources} user={user} navigateTo={navigateTo} />;
        }
        if (user?.role === 'administrador') {
          return <PanelAdmin user={user} subjects={subjects} resources={resources} users={adminUsers} navigateTo={navigateTo} />;
        }
        return (
          <PanelStudent
            user={user}
            subjects={userSubjects}
            notifications={notifications}
            navigateTo={navigateTo}
          />
        );
      case 'explorar':
        return <ExplorePage subjects={subjects} onAddSubject={handleAddSubject} />;
      case 'materia':
        return (
          <MateriaPage
            subject={currentSubject}
            userRole={user?.role}
            exams={exams}
            onStartExam={(examId) => navigateTo('examen', { examId })}
            onNavigate={navigateTo}
            onUpdateExamDate={(subjectId, date) => apiService.updateExamDate(subjectId, date)}
          />
        );
      case 'recursos':
        return (
          <RecursosPage
            resources={resources}
            purchasedResources={purchasedResources}
            onPurchase={handlePurchaseResource}
          />
        );
      case 'foro':
        return (
          <ForoPage
            forums={forums}
            subjects={subjects}
            onOpenTopic={(forumId) => navigateTo('foro-tema', { forumId })}
            onTopicCreated={handleTopicCreated}
          />
        );
      case 'foro-tema':
        return (
          <ForoTemaPage
            topic={currentForumTopic}
            onBack={() => navigateTo('foro')}
            onReply={handleReplyTopic}
          />
        );
      case 'formularios':
        return <FormulariosPage formularies={formularies} />;
      case 'progreso':
        return <ProgresoPage subjects={userSubjects} />;
      case 'examen':
        return <ExamenPage exam={currentExam} onFinish={() => navigateTo('materia')} />;
      case 'simulador':
        return (
          <SimuladorPage
            subject={currentSubject}
            exams={exams}
            onStartExam={(ctx) => navigateTo('examen', ctx)}
            onBack={() => navigateTo('materia', { subjectId: currentSubject?.id })}
          />
        );
      case 'mis-recursos':
        return <MisRecursosPage user={user} resources={resources} />;
      case 'tutorias':
        return <TutoriasPage userRole={user?.role} tutors={tutors} />;
      case 'gestion-usuarios':
        return <GestionUsuariosPage users={adminUsers} onDelete={handleDeleteUser} />;
      case 'gestion-materias':
        return <GestionMateriasPage subjects={subjects} onCreate={handleCreateSubject} onDelete={handleDeleteSubject} />;
      default:
        return <div className="page active"><p>Página no disponible.</p></div>;
    }
  };

  const initials = user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg">
      <div className="flex flex-1">
        <aside className="hidden md:flex md:w-64 flex-col glass-effect-light p-4">
          <div className="flex items-center mb-8">
            <h1 className="text-2xl font-bold text-primary">Estudia-Pro</h1>
          </div>
          <nav className="flex-grow space-y-2">
            {navItems.map((nav) => (
              <button
                key={nav.id}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${currentPage === nav.id ? 'bg-primary/20 text-primary' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}
                onClick={() => navigateTo(nav.id)}
              >
                <span className="mr-3 h-5 w-5 text-slate-400">{nav.icon}</span>
                <span className="font-semibold">{nav.name}</span>
              </button>
            ))}
            {user?.role === 'estudiante' && userSubjects.length > 0 && (
              <div className="pt-4">
                <p className="text-xs uppercase text-slate-400 mb-2">Mis materias</p>
                <div className="space-y-1">
                  {userSubjects.map((subject, index) => {
                    const COLORS = ['bg-yellow-500', 'bg-purple-500', 'bg-red-500', 'bg-cyan-500', 'bg-emerald-500'];
                    const colorClass = COLORS[index % COLORS.length];
                    const isActive = currentPage === 'materia' && currentSubject?.id === subject.id;

                    return (
                      <button
                        key={subject.id}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${isActive
                          ? 'bg-primary/20 text-primary font-semibold shadow-sm'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        onClick={() => navigateTo('materia', { subjectId: subject.id })}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                        <span className="truncate">{subject.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Modo oscuro</span>
              <button
                type="button"
                className={`w-10 h-5 rounded-full relative transition ${darkMode ? 'bg-primary/70' : 'bg-slate-500'}`}
                onClick={() => setDarkMode((prev) => !prev)}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition ${darkMode ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            <div className="flex items-center p-2 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold mr-3">
                {initials}
              </div>
              <div>
                <p className="font-semibold">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              type="button"
              className="w-full flex items-center justify-center text-sm p-2 rounded-lg hover:bg-red-500/20 text-red-500"
              onClick={logout}
            >
              Cerrar Sesión
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col relative">
          <header className="flex items-center justify-between p-4 sticky top-0 z-50 md:absolute md:top-0 md:bg-transparent md:border-none md:w-full md:pointer-events-none">
            {/* Mobile Header elements */}
            <div className="flex items-center gap-4 md:hidden">
              <button className="p-2 rounded-lg bg-primary text-white" onClick={() => setMobileMenu((prev) => !prev)}>
                ☰
              </button>
              <h1 className="text-lg font-bold">Estudia-Pro</h1>
            </div>

            {/* Desktop: Floating Top Right Notification Area */}
            {/* Mobile: Inline Right */}
            <div className="flex items-center gap-4 ml-auto md:pointer-events-auto md:pr-6">
              <button
                className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                onClick={() => setShowNotifications(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                {notifications?.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 pointer-events-none" />
                )}
              </button>
              <button className="text-sm text-red-500 md:hidden" onClick={logout}>Salir</button>
            </div>
          </header>

          {mobileMenu && (
            <div className="md:hidden bg-dark-bg/95 text-white fixed inset-0 z-40 p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Menú</h2>
                <button onClick={() => setMobileMenu(false)} className="p-2 ml-auto">✕</button>
              </div>
              <nav className="space-y-3">
                {navItems.map((nav) => (
                  <button
                    key={nav.id}
                    className="flex items-center gap-3 w-full text-left py-2 text-lg"
                    onClick={() => navigateTo(nav.id)}
                  >
                    <div className="text-white">{nav.icon}</div>
                    {nav.name}
                  </button>
                ))}
              </nav>
            </div>
          )}
          <main className="flex-1 overflow-y-auto p-6">{renderPage()}</main>
        </div>
      </div>

      {/* Notification Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-slate-900 border border-white/10 text-slate-100 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                Notificaciones
                {notifications?.some(n => !n.read) && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto">
                    {notifications.filter(n => !n.read).length} nuevas
                  </span>
                )}
              </h3>
              <button className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors" onClick={() => setShowNotifications(false)}>✕</button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              {notifications?.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all ${notif.read ? 'bg-slate-800/50 border-white/5 opacity-70' : 'bg-slate-800 border-primary/30 shadow-lg shadow-primary/5'}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className={`font-semibold text-sm ${!notif.read ? 'text-white' : 'text-slate-400'}`}>{notif.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-slate-500 mt-2 block">{new Date(notif.date).toLocaleDateString()}</span>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          className="text-xs text-primary hover:text-primary-light whitespace-nowrap px-2 py-1 rounded hover:bg-white/5 transition"
                        >
                          Marcar leída
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <span className="text-4xl block mb-2">🔕</span>
                  <p>No tienes notificaciones nuevas</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                className="text-sm text-slate-400 hover:text-white"
                onClick={() => setShowNotifications(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardShell;
