import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoRole: (role: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('vynk_access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res: any = await api.get('/auth/me');
      if (res?.success) {
        setUser(res.data);
      }
    } catch (e) {
      console.warn('Failed to restore user session:', e);
      localStorage.removeItem('vynk_access_token');
      localStorage.removeItem('vynk_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res: any = await api.post('/auth/login', { email, password: pass });
    if (res?.success) {
      localStorage.setItem('vynk_access_token', res.data.accessToken);
      localStorage.setItem('vynk_refresh_token', res.data.refreshToken);
      setUser(res.data.user);
    }
  };

  const register = async (data: any) => {
    const res: any = await api.post('/auth/register', data);
    if (res?.success) {
      localStorage.setItem('vynk_access_token', res.data.accessToken);
      localStorage.setItem('vynk_refresh_token', res.data.refreshToken);
      setUser(res.data.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('vynk_access_token');
    localStorage.removeItem('vynk_refresh_token');
    setUser(null);
  };

  // Demo helper for the hackathon presentation script
  const switchDemoRole = async (targetRole: Role) => {
    const demoAccounts: Record<Role, string> = {
      STUDENT: 'student1@vynk.local',
      MAINTENANCE: 'tech.plumbing@vynk.local',
      WARDEN: 'warden.boys@vynk.local',
      SUPERADMIN: 'admin@vynk.local',
    };

    const email = demoAccounts[targetRole];
    await login(email, 'password123');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
