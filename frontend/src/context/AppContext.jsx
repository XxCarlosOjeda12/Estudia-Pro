import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiService, formatUserForFrontend, isDemoMode, setDemoMode, toggleDemoMode as toggleDemo } from '../lib/api';

const AppContext = createContext(null);

const initialCache = {
  subjects: [],
  userSubjects: [],
  resources: [],
  purchasedResources: [],
  exams: [],
  tutors: [],
  forums: [],
  formularies: []
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [cache, setCache] = useState(initialCache);
  const [toasts, setToasts] = useState([]);
  const [demoEnabled, setDemoEnabled] = useState(isDemoMode());

  const resetSession = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setNotifications([]);
    setCache(initialCache);
  };

  const login = async (identifier, password, remember) => {
    setLoading(true);
    const response = await apiService.login(identifier, password);
    setLoading(false);
    if (response?.success && response.token) {
      setToken(response.token);
      localStorage.setItem('authToken', response.token);
      if (remember) localStorage.setItem('savedIdentifier', identifier);
      const profile = await loadProfile();
      return { success: true, profile };
    }
    return response || { success: false, message: 'Inicio de sesión fallido' };
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await apiService.getProfile();
      setUser(formatUserForFrontend(profile?.raw || profile));
      return { success: true, profile };
    } catch (error) {
      console.error(error);
      await logout();
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.warn('Logout error', error);
    } finally {
      resetSession();
    }
  };

  const refreshNotifications = useCallback(async () => {
    try {
      const list = await apiService.getUserNotifications();
      setNotifications(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('notifications error', error);
    }
  }, []);

  const loadCollection = async (key, loader) => {
    if (cache[key] && cache[key].length) return cache[key];
    const data = await loader();
    setCache((prev) => ({ ...prev, [key]: data }));
    return data;
  };

  const toggleDemoMode = () => {
    const enabled = toggleDemo();
    setDemoEnabled(enabled);
    resetSession();
    return enabled;
  };

  const enableDemoMode = (flag) => {
    setDemoMode(flag);
    setDemoEnabled(flag);
    resetSession();
  };

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(({ title, message, type = 'info' }) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => dismissToast(id), 5000);
  }, [dismissToast]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    notifications,
    demoEnabled,
    cache,
    toasts,
    login,
    loadProfile,
    logout,
    refreshNotifications,
    loadCollection,
    toggleDemoMode,
    enableDemoMode,
    pushToast,
    dismissToast
  }), [user, token, loading, notifications, demoEnabled, cache, toasts, loadProfile, pushToast, dismissToast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
