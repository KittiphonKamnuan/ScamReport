import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { cognitoService } from '../services/cognito';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshTimerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  // Token refresh logic - refresh every 50 minutes
  const startTokenRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Set up new refresh timer (50 minutes)
    refreshTimerRef.current = setInterval(async () => {
      try {
        console.log('Refreshing token...');
        const newToken = await cognitoService.refreshToken();

        if (newToken && user) {
          const updatedUser = { ...user, token: newToken };
          setUser(updatedUser);

          // Update storage
          localStorage.setItem('authToken', newToken);
          localStorage.setItem('user', JSON.stringify(updatedUser));

          console.log('Token refreshed successfully');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Force logout if refresh fails
        logout();
      }
    }, 50 * 60 * 1000); // 50 minutes
  }, [user]);

  const checkUser = async () => {
    try {
      // Try to get session from Cognito
      const session = await cognitoService.getSession();

      if (session && session.tokens?.idToken) {
        const token = session.tokens.idToken.toString();
        const payload = session.tokens.idToken.payload;

        const userData = {
          email: payload.email,
          name: payload.name || payload.email,
          role: payload['cognito:groups']?.[0] || 'user',
          groups: payload['cognito:groups'] || [],
          token
        };

        setUser(userData);

        // Store token separately for API use (FIX: Token Mismatch)
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));

        // Start token refresh
        startTokenRefresh();
      } else {
        // No session, clear everything
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.log('No active session:', error.message);
      // Clear stored data on error
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const userData = await cognitoService.login(email, password);

      setUser(userData);

      // Store token separately (FIX: Token Mismatch)
      localStorage.setItem('authToken', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Start token refresh
      startTokenRefresh();

      return userData;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      // Clear refresh timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      await cognitoService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear state and storage
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
  }, []);

  const hasRole = (requiredRole) => {
    if (!user) return false;
    return user.groups.includes(requiredRole);
  };

  const refreshSession = async () => {
    try {
      await checkUser();
    } catch (error) {
      console.error('Session refresh failed:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout,
      hasRole,
      refreshSession,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};