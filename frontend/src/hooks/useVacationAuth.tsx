import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  api, 
  User, 
  LoginRequest, 
  RegisterRequest, 
  UpdateProfileRequest, 
  ChangePasswordRequest 
} from '../api/api';

// Auth Context
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage
const TOKEN_KEY = 'vacation-gallery-token';
const USER_KEY = 'vacation-gallery-user';

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const getStoredUser = (): User | null => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const setStoredToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors
  }
};

const setStoredUser = (user: User | null) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // Ignore storage errors
  }
};

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        // Set token in API client
        api.setAuthToken(storedToken);
        
        try {
          // Verify token is still valid
          const { valid, user: verifiedUser } = await api.verifyToken();
          if (valid) {
            setUser(verifiedUser);
            setToken(storedToken);
            setStoredUser(verifiedUser); // Update stored user with fresh data
          } else {
            // Token is invalid, clear auth state
            clearAuth();
          }
        } catch (error) {
          // Token verification failed, clear auth state
          clearAuth();
        }
      }
      setIsInitialized(true);
    };

    initAuth();
  }, []);

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setStoredToken(null);
    setStoredUser(null);
    api.setAuthToken(null);
    queryClient.clear(); // Clear all queries on logout
  };

  const setAuth = (authData: { user: User; token: string }) => {
    setUser(authData.user);
    setToken(authData.token);
    setStoredUser(authData.user);
    setStoredToken(authData.token);
    api.setAuthToken(authData.token);
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (response) => {
      setAuth({ user: response.user, token: response.token });
    },
    onError: (error) => {
      clearAuth();
      throw error;
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: api.register,
    onSuccess: (response) => {
      setAuth({ user: response.user, token: response.token });
    },
    onError: (error) => {
      clearAuth();
      throw error;
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: (response) => {
      setUser(response.user);
      setStoredUser(response.user);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: api.changePassword,
  });

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading: !isInitialized || loginMutation.isPending || registerMutation.isPending,
    login: async (credentials: LoginRequest) => {
      await loginMutation.mutateAsync(credentials);
    },
    register: async (userData: RegisterRequest) => {
      await registerMutation.mutateAsync(userData);
    },
    logout: clearAuth,
    updateProfile: async (data: UpdateProfileRequest) => {
      await updateProfileMutation.mutateAsync(data);
    },
    changePassword: async (data: ChangePasswordRequest) => {
      await changePasswordMutation.mutateAsync(data);
    },
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// useAuth hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth hooks for specific operations
export function useLogin() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: login,
  });
}

export function useRegister() {
  const { register } = useAuth();
  return useMutation({
    mutationFn: register,
  });
}

export function useUpdateProfile() {
  const { updateProfile } = useAuth();
  return useMutation({
    mutationFn: updateProfile,
  });
}

export function useChangePassword() {
  const { changePassword } = useAuth();
  return useMutation({
    mutationFn: changePassword,
  });
}
