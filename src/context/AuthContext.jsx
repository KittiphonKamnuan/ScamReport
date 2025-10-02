import React, { createContext, useState, useEffect } from 'react';
import { cognitoService } from '../services/cognito';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const session = await cognitoService.getSession();
      const token = session.getIdToken().getJwtToken();
      const payload = session.getIdToken().decodePayload();

      setUser({
        email: payload.email,
        name: payload.name,
        role: payload['cognito:groups']?.[0] || 'user',
        groups: payload['cognito:groups'] || [],
        token
      });
    } catch (error) {
      console.log('No active session');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const userData = await cognitoService.login(email, password);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    cognitoService.logout();
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    return user.groups.includes(requiredRole);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      login, 
      logout, 
      hasRole,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};