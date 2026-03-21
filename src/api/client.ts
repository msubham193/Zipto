import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://api.ridezipto.com/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];
let logoutCallback: (() => void) | null = null;
let tokenUpdateCallback: ((token: string, refreshToken: string) => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

export const setTokenUpdateCallback = (callback: (token: string, refreshToken: string) => void) => {
  tokenUpdateCallback = callback;
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    console.log('🔴 API Error:', error.response?.status, error.response?.data?.message || error.message);

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 Token expired, attempting refresh...');

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');

        if (!refreshToken) {
          console.log('❌ No refresh token — forcing logout');
          processQueue(new Error('No refresh token'), null);
          isRefreshing = false;
          await AsyncStorage.multiRemove(['auth_token', 'refresh_token']);
          if (logoutCallback) logoutCallback();
          return Promise.reject(error);
        }

        console.log('🔄 Calling refresh token API...');

        // Call refresh token endpoint
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refresh_token: refreshToken,
        });

        if (response.data.success && response.data.data) {
          const { access_token, refresh_token: newRefreshToken } = response.data.data;

          console.log('✅ Token refreshed successfully!');
          console.log('🔑 New Bearer Token:', access_token);

          // Update tokens in AsyncStorage
          await AsyncStorage.setItem('auth_token', access_token);
          await AsyncStorage.setItem('refresh_token', newRefreshToken);

          // Update the authorization header
          client.defaults.headers.common.Authorization = `Bearer ${access_token}`;
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          // Trigger token update callback
          if (tokenUpdateCallback) {
            console.log('🔄 Triggering token update callback...');
            tokenUpdateCallback(access_token, newRefreshToken);
          }

          processQueue(null, access_token);
          isRefreshing = false;

          // Retry the original request
          return client(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError: any) {
        console.log('❌ Token refresh failed:', refreshError.message);
        processQueue(refreshError, null);
        isRefreshing = false;

        // Clear tokens and logout user
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.removeItem('refresh_token');

        // Trigger store logout if callback is registered
        if (logoutCallback) {
          console.log('🔄 Triggering store logout callback...');
          logoutCallback();
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  registerCustomer: async (phone: string) => {
    const response = await client.post('/auth/customer/register', {
      phone,
      role: 'customer',
    });
    return response.data;
  },

  verifyOtp: async (phone: string, otp: string) => {
    const response = await client.post('/auth/verify-otp', {
      phone,
      otp,
    });
    return response.data;
  },


  getCustomerProfile: async () => {
    const response = await client.get('/customer/profile');
    return response.data;
  },

  updateCustomerProfile: async (data: any) => {
    const response = await client.put('/customer/profile', data);
    return response.data;
  },

  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await client.post('/auth/refresh-token', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

export default client;
