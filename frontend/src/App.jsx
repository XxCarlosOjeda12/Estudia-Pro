import { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext.jsx';
import LoginPage from './views/LoginPage.jsx';
import RegisterPage from './views/RegisterPage.jsx';
import DashboardShell from './views/DashboardShell.jsx';
import NotificationStack from './components/NotificationStack.jsx';

const App = () => {
  const { user, token, loadProfile } = useAppContext();
  const [authView, setAuthView] = useState('login');  

  useEffect(() => {
    if (token && !user) {
      loadProfile();
    }
  }, [token, user, loadProfile]);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-slate-800 dark:text-slate-200">
      {user ? (
        <DashboardShell />
      ) : authView === 'register' ? (
        <RegisterPage onNavigate={(view) => setAuthView(view)} />
      ) : (
        <LoginPage onNavigate={(view) => setAuthView(view)} />
      )}
      <NotificationStack />
    </div>
  );
};

export default App;
