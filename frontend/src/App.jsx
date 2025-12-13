import { useEffect } from 'react';
import { useAppContext } from './context/AppContext.jsx';
import LoginPage from './views/LoginPage.jsx';
import DashboardShell from './views/DashboardShell.jsx';
import NotificationStack from './components/NotificationStack.jsx';

const App = () => {
  const { user, token, loadProfile } = useAppContext();

  useEffect(() => {
    if (token && !user) {
      loadProfile();
    }
  }, [token, user, loadProfile]);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-slate-800 dark:text-slate-200">
      {user ? <DashboardShell /> : <LoginPage />}
      <NotificationStack />
    </div>
  );
};

export default App;
