import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/client';

const CUSTOMER_ROLE = 'customer';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  is_profile_complete: boolean;
  language_preference: string;
  created_at: string;
  updated_at: string;
  email: string | null;
}

interface CustomerProfile {
  id: string;
  user_id: string;
  address: string | null;
  saved_locations: any[];
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  profile: CustomerProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsProfileSetup: boolean;
  isNewUser: boolean;

  // Actions
  login: (phone: string) => Promise<any>;
  verifyOtp: (phone: string, otp: string) => Promise<any>;
  emailLogin: (email: string, password: string) => Promise<any>;
  emailRegister: (name: string, email: string, password: string) => Promise<any>;
  fetchProfile: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setNeedsProfileSetup: (value: boolean) => void;
}

const isCustomerRole = (role?: string | null) =>
  role?.trim().toLowerCase() === CUSTOMER_ROLE;

const getCustomerRoleError = (role?: string | null) => {
  if (role) {
    return `This app only supports customer accounts. Current role: ${role}.`;
  }

  return 'This app only supports customer accounts.';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      needsProfileSetup: false,
      isNewUser: false,

      login: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.registerCustomer(phone);
          set({ isLoading: false });
          return response;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Failed to send OTP'
          });
          throw error;
        }
      },

      emailLogin: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.customerEmailLogin(email, password);
          if (response.success && response.data) {
            const { user, access_token, refresh_token, is_new_user } = response.data;
            if (!isCustomerRole(user?.role)) {
              const roleError = getCustomerRoleError(user?.role);
              set({ user: null, profile: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false, error: roleError });
              throw new Error(roleError);
            }
            await AsyncStorage.setItem('auth_token', access_token);
            await AsyncStorage.setItem('refresh_token', refresh_token);
            const profileIncomplete = is_new_user === true || user?.is_profile_complete === false;
            set({ user, token: access_token, refreshToken: refresh_token, isAuthenticated: true, isLoading: false, isNewUser: !!is_new_user, needsProfileSetup: profileIncomplete });
            return response.data;
          }
          throw new Error('Login failed');
        } catch (error: any) {
          const raw = error.response?.data?.message ?? error.message ?? 'Login failed';
          const msg = Array.isArray(raw) ? raw.join('\n') : String(raw);
          set({ isLoading: false, error: msg });
          throw error;
        }
      },

      emailRegister: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.customerEmailRegister(name, email, password);
          if (response.success && response.data) {
            const { user, access_token, refresh_token } = response.data;
            await AsyncStorage.setItem('auth_token', access_token);
            await AsyncStorage.setItem('refresh_token', refresh_token);
            set({ user, token: access_token, refreshToken: refresh_token, isAuthenticated: true, isLoading: false, isNewUser: true, needsProfileSetup: true });
            return response.data;
          }
          throw new Error('Registration failed');
        } catch (error: any) {
          const raw = error.response?.data?.message ?? error.message ?? 'Registration failed';
          const msg = Array.isArray(raw) ? raw.join('\n') : String(raw);
          set({ isLoading: false, error: msg });
          throw error;
        }
      },

      verifyOtp: async (phone: string, otp: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.verifyOtp(phone, otp);

          if (response.success && response.data) {
            const { user, access_token, refresh_token, is_new_user } = response.data;

            if (!isCustomerRole(user?.role)) {
              const roleError = getCustomerRoleError(user?.role);
              await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
              set({
                user: null,
                profile: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: roleError,
              });
              throw new Error(roleError);
            }

            // Save tokens to AsyncStorage for axios interceptor
            await AsyncStorage.setItem('auth_token', access_token);
            await AsyncStorage.setItem('refresh_token', refresh_token);

            // Determine if profile setup is needed:
            // true for brand-new users OR existing users who never completed their profile
            const profileIncomplete = is_new_user === true || user?.is_profile_complete === false;


            set({
              user,
              token: access_token,
              refreshToken: refresh_token,
              isAuthenticated: true,
              isLoading: false,
              isNewUser: is_new_user === true,
              needsProfileSetup: profileIncomplete,
            });
            return response.data;
          } else {
            throw new Error('Verification failed');
          }
        } catch (error: any) {
          console.error('Verify OTP Error:', error);
          set({
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Invalid OTP'
          });
          throw error;
        }
      },

      fetchProfile: async () => {
        try {
          const currentUser = get().user;

          if (currentUser && !isCustomerRole(currentUser.role)) {
            const roleError = getCustomerRoleError(currentUser.role);
            console.log('🚫 Skipping customer profile fetch for non-customer session');
            await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
            set({
              user: null,
              profile: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: roleError,
            });
            return;
          }

          const response = await authApi.getCustomerProfile();

          // Safe check for response existance
          if (response?.success && response?.data) {
            const { user, ...profileData } = response.data;

            // Sync needsProfileSetup from the latest profile data on app restart
            const profileIncomplete = user?.is_profile_complete === false;

            set({
              user,
              profile: profileData,
              needsProfileSetup: profileIncomplete,
            });
          } else {
            console.log('⚠️ Fetch profile returned invalid response:', response);
          }
        } catch (error: any) {

          const apiMessage = error.response?.data?.message;
          
          // Check for various forms of 401 Unauthorized
          const isUnauthorized = 
            error.response?.status === 401 || 
            error.response?.data?.statusCode === 401 ||
            (error.message && error.message.includes('401'));

          const isCustomerRoleMismatch =
            error.response?.status === 403 &&
            typeof apiMessage === 'string' &&
            apiMessage.toLowerCase().includes('requires one of the following roles: customer');
          
          if (isUnauthorized) {
            await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
            set({
              user: null,
              profile: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
            });
            return;
          }

          if (isCustomerRoleMismatch) {
            const roleError = getCustomerRoleError(get().user?.role);
            await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
            set({
              user: null,
              profile: null,
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
              error: roleError,
            });
            return;
          }

          set({
            error: apiMessage || error.message || 'Failed to fetch profile',
          });
        }
      },

      refreshAccessToken: async () => {
        try {
          const currentRefreshToken = get().refreshToken;
          
          if (!currentRefreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authApi.refreshToken(currentRefreshToken);

          if (response.success && response.data) {
            const { access_token, refresh_token } = response.data;

            // Update AsyncStorage
            await AsyncStorage.setItem('auth_token', access_token);
            await AsyncStorage.setItem('refresh_token', refresh_token);

            // Update state
            set({
              token: access_token,
              refreshToken: refresh_token,
            });
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (error: any) {
          console.error('Refresh token error:', error);
          // If refresh fails, logout the user
          await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
          set({
            user: null,
            profile: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call logout API to invalidate token on server
          await authApi.logout();
        } catch (error: any) {
          console.error('Logout API error:', error);
          // Continue with local logout even if API fails
        } finally {
          // Always clear local state
          await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
          set({
            user: null,
            profile: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            needsProfileSetup: false,
            isNewUser: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),
      setNeedsProfileSetup: (value: boolean) => set({ needsProfileSetup: value }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        needsProfileSetup: state.needsProfileSetup,
        isNewUser: state.isNewUser,
      }),
    }
  )
);

// Register the independent logout function to avoid circular dependencies
// This allows axios interceptors to trigger store logout even though client.ts doesn't import useAuthStore
import { setLogoutCallback, setTokenUpdateCallback } from '../api/client';

setLogoutCallback(() => {
  // Force-clear auth state WITHOUT calling the logout API.
  // Calling logout() from here would hit POST /auth/logout → 401 → retry → infinite loop.
  AsyncStorage.multiRemove(['auth_token', 'refresh_token']).catch(console.error);
  useAuthStore.setState({
    user: null,
    profile: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    needsProfileSetup: false,
    isNewUser: false,
    error: null,
  });
});

setTokenUpdateCallback((token, refreshToken) => {
  useAuthStore.setState({
    token, 
    refreshToken 
  });
});
