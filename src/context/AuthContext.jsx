import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../services/authService';
import { getAccessToken, getRefreshToken, clearTokens } from '../services/api';
import { jwtDecode } from './jwtDecode';
// import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  

  // Decode token to extract user info
  // useEffect(() => {
  //   const token = getAccessToken();
  //   if (!token) {
  //     setLoading(false);
  //     return;
  //   }
  //   const loadUser = async () => {
  //     try{
  //       const  {data}  = await api.get('/accounts/me/');
  //       console.log('Fetched current user:', data);
  //       setUser({
  //         id : data.id || '',
  //         name: data.name || '',
  //         email: data.email || '',
  //         first_name: data.first_name || '',
  //         last_name: data.last_name || '',
  //       });
  //     } catch (error) {
  //       console.error('Failed to fetch current user:', error);
  //       clearTokens();
  //       setUser(null);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  // }, []);
  // On mount, check for existing token
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
      } catch (error) {
        console.error('Failed to fetch current user:', error);
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    console.log('Attempting login with email:', email);
    const data = await loginUser(email, password);
    const userData = jwtDecode(data.access);
    console.log('Decoded user data from token:', userData);
    setUser(userData);
    return data;
  };

  const register = async (formData) => {
    await registerUser(formData);
    // Auto-login after registration
    const data = await loginUser(formData.email, formData.password);
    const userData = jwtDecode(data.access);
    console.log('Decoded user data from token after registration:', userData);
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
