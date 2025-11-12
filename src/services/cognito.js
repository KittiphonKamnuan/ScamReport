import { Amplify } from 'aws-amplify';
import { 
  signIn, 
  signOut, 
  getCurrentUser, 
  fetchAuthSession
} from 'aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_CLIENT_ID,
      region: import.meta.env.VITE_REGION,
      loginWith: {
        username: true,
        email: true
      }
    }
  }
});

// Helper function สำหรับดึงข้อมูล user (ย้ายออกมาข้างนอก)
const getUserData = async () => {
  try {
    const session = await fetchAuthSession();
    console.log('✅ Session fetched:', session);
    
    const token = session.tokens?.idToken?.toString();
    const payload = session.tokens?.idToken?.payload;

    if (!token || !payload) {
      throw new Error('Invalid session data');
    }

    const userData = {
      token,
      email: payload.email,
      name: payload.name || payload.email,
      role: payload['cognito:groups']?.[0] || 'user',
      groups: payload['cognito:groups'] || [],
      sub: payload.sub
    };

    console.log('✅ User data:', userData);
    
    // Store in localStorage
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));

    return userData;
  } catch (error) {
    console.error('❌ Get user data error:', error);
    throw error;
  }
};

export const cognitoService = {
  login: async (email, password) => {
    try {
      console.log('🔐 Starting login process...');
      
      // ลอง sign in ก่อน
      try {
        const result = await signIn({
          username: email,
          password: password
        });

        console.log('✅ SignIn result:', result);

        if (result.isSignedIn) {
          return await getUserData();
        }

        throw new Error('Login failed - not signed in');
        
      } catch (signInError) {
        // ถ้าเจอ UserAlreadyAuthenticatedException
        if (signInError.name === 'UserAlreadyAuthenticatedException') {
          console.log('⚠️ User already authenticated, signing out first...');
          
          // Sign out session เก่า
          await signOut();
          
          console.log('✅ Old session cleared, retrying login...');
          
          // รอสักครู่ให้ sign out เสร็จสมบูรณ์
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // ลอง sign in ใหม่อีกครั้ง
          const result = await signIn({
            username: email,
            password: password
          });

          console.log('✅ SignIn result (after retry):', result);

          if (result.isSignedIn) {
            return await getUserData();
          }

          throw new Error('Login failed after retry');
        }
        
        // ถ้าเป็น error อื่นๆ ให้ throw ต่อไป
        throw signInError;
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log('🚪 Starting logout...');
      await signOut();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Clear auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
  },

  getCurrentUser: async () => {
    try {
      const user = await getCurrentUser();
      console.log('Current user:', user);
      return user;
    } catch (error) {
      console.log('No current user:', error.message);
      return null;
    }
  },

  getSession: async () => {
    try {
      const session = await fetchAuthSession();
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      const token = session.tokens?.idToken?.toString();
      
      if (token) {
        localStorage.setItem('authToken', token);
      }
      
      return token;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw error;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken !== undefined;
    } catch {
      return false;
    }
  },

  // Get user data (เพิ่ม public method)
  getUserData: async () => {
    return await getUserData();
  },

  // Clear all sessions
  clearAllSessions: async () => {
    try {
      await signOut({ global: true });
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ All sessions cleared');
    } catch (error) {
      console.error('❌ Clear sessions error:', error);
      // Force clear anyway
      localStorage.clear();
      sessionStorage.clear();
    }
  }
};

export default cognitoService;