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
      const [
        subjectsData,
        resourcesData,
        examsData,
        forumsData,
        formulariesData,
        tutorsData
      ] = await Promise.all([
        apiService.getAllSubjects(),
        apiService.getAllResources(),
        apiService.getAllExams(),
        apiService.getAllForums(),
        apiService.getAllFormularies(),
        apiService.getAllTutors()
      ]);
      setSubjects(subjectsData);
      setResources(resourcesData);
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
    bootstrap().catch((error) => console.error(error));
  }, [user, refreshNotifications]);

  const navItems = useMemo(() => {
    if (user?.role === 'administrador') {
      return [
        { id: 'panel', name: 'Panel General', icon: '🏠' },
        { id: 'gestion-usuarios', name: 'Usuarios', icon: '👥' },
        { id: 'gestion-materias', name: 'Gestión Materias', icon: '📘' }
      ];
    }
    if (user?.role === 'creador') {
      return [
        { id: 'panel', name: 'Mi Panel', icon: '🏠' },
        { id: 'mis-recursos', name: 'Mis Recursos', icon: '📚' },
        { id: 'tutorias', name: 'Mis Tutorías', icon: '🧑‍🏫' },
        { id: 'foro', name: 'Foro de Ayuda', icon: '💬' }
      ];
    }
    // Estudiante por defecto
    return [
      { id: 'panel', name: 'Mi Panel', icon: '🏠' },
      { id: 'explorar', name: 'Explorar Materias', icon: '🔍' },
      { id: 'recursos', name: 'Recursos Comunidad', icon: '📁' },
      { id: 'foro', name: 'Foro de Ayuda', icon: '💬' },
      { id: 'formularios', name: 'Formularios', icon: '📄' },
      { id: 'progreso', name: 'Mi Progreso', icon: '📈' },
      { id: 'tutorias', name: 'Tutorías SOS', icon: '🧑‍🏫' }
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
                  {userSubjects.map((subject) => (
                    <button
                      key={subject.id}
                      className="w-full text-left text-sm text-slate-600 dark:text-slate-200 hover:text-primary px-2 py-1 rounded transition-colors"
                      onClick={() => navigateTo('materia', { subjectId: subject.id })}
                    >
                      {subject.title}
                    </button>
                  ))}
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
                className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setShowNotifications(true)}
              >
                <span className="text-xl">🔔</span>
                {notifications?.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-light-bg dark:border-dark-bg">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              <button className="text-sm text-red-500 md:hidden" onClick={logout}>Salir</button>
            </div>
          </header>
          {mobileMenu && (
            <div className="md:hidden bg-dark-bg/95 text-white fixed inset-0 z-40 p-6">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">Menú</h2>
                <button onClick={() => setMobileMenu(false)}>✕</button>
              </div>
              <nav className="space-y-3">
                {navItems.map((nav) => (
                  <button
                    key={nav.id}
                    className="block w-full text-left py-2 text-lg"
                    onClick={() => navigateTo(nav.id)}
                  >
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
          <div className="bg-slate-900 border border-white/10 text-slate-100 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                🔔 Notificaciones
                {notifications?.some(n => !n.read) && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {notifications.filter(n => !n.read).length} nuevas
                  </span>
                )}
              </h3>
              <button className="text-slate-400 hover:text-white" onClick={() => setShowNotifications(false)}>✕</button>
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
