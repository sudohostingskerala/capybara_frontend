import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../services/authService';
import { getAccessToken, getRefreshToken, clearTokens } from '../services/api';
import { jwtDecode } from './jwtDecode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  

  // On mount, check for an existing token.
  useEffect(() => {
    const token = getAccessToken();
    if (!token){
      setLoading(false);
      return;
    }
    const loadUser = async()=> {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch {
        console.error('Failed to fetch current user.');
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    const userData = jwtDecode(data.access);
    setUser(userData);
    return data;
  };

  const register = async (formData) => {
    await registerUser(formData);
    // Auto-login after registration
    const data = await loginUser(formData.email, formData.password);
    const userData = jwtDecode(data.access);
    setUser(userData);
    return data;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  const isAuthenticated = !!user && !!getAccessToken();

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
