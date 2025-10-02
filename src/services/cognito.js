import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_CLIENT_ID,
      region: import.meta.env.VITE_REGION
    }
  }
});

export const cognitoService = {
  login: async (email, password) => {
    try {
      // ลอง sign out session เก่าก่อน
      try {
        await signOut();
      } catch (e) {
        // ไม่มี session เก่า ไม่ต้องทำอะไร
      }

      const { isSignedIn } = await signIn({
        username: email,
        password: password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH'
        }
      });

      if (isSignedIn) {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken.toString();
        const payload = session.tokens.idToken.payload;

        return {
          token,
          email: payload.email,
          name: payload.name,
          role: payload['cognito:groups']?.[0] || 'user',
          groups: payload['cognito:groups'] || []
        };
      }

      throw new Error('Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await signOut({ global: true });
      localStorage.clear();
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.clear();
    }
  },

  getCurrentUser: async () => {
    try {
      return await getCurrentUser();
    } catch (error) {
      return null;
    }
  },

  getSession: async () => {
    try {
      return await fetchAuthSession();
    } catch (error) {
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      return session.tokens.idToken.toString();
    } catch (error) {
      throw error;
    }
  }
};

export default cognitoService;