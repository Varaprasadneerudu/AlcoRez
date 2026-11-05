import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api, setStoredToken, getStoredToken, getStoredRole, getStoredUser, invalidateCache } from '../services/api';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = {
  customer: {
    email: 'customer@demo.com',
    password: 'Customer@123456',
    label: 'Customer (Ravi Teja Varma)',
    role: 'customer'
  },
  retailer: {
    email: 'retailer@madhapurwines.mock',
    password: 'Retailer@123456',
    label: 'Licensed Retailer (Madhapur Wines)',
    role: 'retailer'
  },
  admin: {
    email: 'admin@telanganaliquor.gov.mock',
    password: 'Admin@123456',
    label: 'Excise Admin (Govt of Telangana)',
    role: 'admin'
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [role, setRole] = useState(() => getStoredRole());
  const [ageVerified, setAgeVerified] = useState(() => {
    try {
      return (
        sessionStorage.getItem('alco_age_verified') === 'true' ||
        localStorage.getItem('alco_age_verified') === 'true'
      );
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);
  const initialValidationDone = useRef(false);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole('customer');
    setStoredToken(null);
    invalidateCache();
    initialValidationDone.current = false;
  }, []);

  useEffect(() => {
    // Validate session on app load to guarantee client role strictly matches backend token
    if (token && !initialValidationDone.current) {
      initialValidationDone.current = true;
      api.getMe()
        .then((userData) => {
          const userProfile = { id: userData.id, email: userData.email, full_name: userData.full_name, role: userData.role };
          setUser(userProfile);
          setRole(userData.role);
          setStoredToken(token, userData.role, userProfile);
        })
        .catch(() => {
          logout();
        });
    }
  }, [token, logout]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      initialValidationDone.current = true; // Mark validated so /auth/me isn't called redundantly
      const userProfile = { id: data.user_id, email: data.email, full_name: data.full_name, role: data.role };
      setUser(userProfile);
      setRole(data.role);
      setStoredToken(data.access_token, data.role, userProfile);
      setToken(data.access_token);
      setAgeVerified(true);
      try {
        sessionStorage.setItem('alco_age_verified', 'true');
        localStorage.setItem('alco_age_verified', 'true');
      } catch (e) {
        console.warn(e);
      }
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    try {
      await api.register(userData);
      // Automatically log in after registration
      return await login(userData.email, userData.password);
    } finally {
      setLoading(false);
    }
  }, [login]);

  const switchDemoAccount = useCallback(async (accountKey) => {
    const creds = DEMO_ACCOUNTS[accountKey];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  }, [login]);

  const confirmAge = useCallback(() => {
    setAgeVerified(true);
    try {
      sessionStorage.setItem('alco_age_verified', 'true');
      localStorage.setItem('alco_age_verified', 'true');
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      role,
      isAuthenticated: !!token,
      ageVerified,
      confirmAge,
      login,
      register,
      logout,
      switchDemoAccount,
      loading,
    }),
    [token, user, role, ageVerified, confirmAge, login, register, logout, switchDemoAccount, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
