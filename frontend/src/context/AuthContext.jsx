import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, setStoredToken, getStoredToken, invalidateCache } from '../services/api';

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
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('alco_user_profile');
      return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState(() => localStorage.getItem('alco_user_role') || 'customer');
  const [ageVerified, setAgeVerified] = useState(() => {
    return localStorage.getItem('alco_age_verified') === 'true';
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
    // Only fetch /auth/me on initial app load if a stored token exists without user profile
    if (token && !initialValidationDone.current) {
      initialValidationDone.current = true;
      if (!user) {
        api.getMe()
          .then((userData) => {
            setUser(userData);
            setRole(userData.role);
            setStoredToken(token, userData.role, userData);
          })
          .catch(() => {
            logout();
          });
      }
    }
  }, [token, user, logout]);

  const login = async (email, password) => {
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
      localStorage.setItem('alco_age_verified', 'true');
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      await api.register(userData);
      // Automatically log in after registration
      return await login(userData.email, userData.password);
    } finally {
      setLoading(false);
    }
  };

  const switchDemoAccount = async (accountKey) => {
    const creds = DEMO_ACCOUNTS[accountKey];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const confirmAge = () => {
    setAgeVerified(true);
    localStorage.setItem('alco_age_verified', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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
