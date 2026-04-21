import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { LoginData, User, AuthResponse, RefreshResponse, AuthState } from '../types/Auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Инициализация при загрузке приложения
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userStr = localStorage.getItem('user');

      if (accessToken && refreshToken && userStr) {
        try {
          // Проверяем срок действия токена
          const tokenExpiry = getTokenExpiry(accessToken);
          const now = Date.now();

          if (tokenExpiry < now) {
            // Токен истек - пробуем обновить
            const refreshed = await tryRefreshToken(refreshToken);
            if (!refreshed) {
              // Если не удалось обновить - очищаем и выходим
              localStorage.clear();
              setAuthState({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }
          } else {
            const user = JSON.parse(userStr);
            setAuthState({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.clear();
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const tryRefreshToken = async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data: RefreshResponse = await response.json();
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      localStorage.setItem('accessToken', data.access);
      setAuthState({
        user,
        accessToken: data.access,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  // Автоматическое обновление токена
  useEffect(() => {
    if (authState.isAuthenticated && authState.accessToken) {
      const tokenExpiry = getTokenExpiry(authState.accessToken);
      const now = Date.now();
      const timeUntilExpiry = tokenExpiry - now;

      // Обновляем токен за 5 минут до истечения
      const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);

      const timer = setTimeout(() => {
        refreshAccessToken();
      }, refreshTime);

      return () => clearTimeout(timer);
    }
  }, [authState.accessToken, authState.isAuthenticated]);

  const getTokenExpiry = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000;
    } catch (error) {
      return 0;
    }
  };

  const login = async (data: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка входа' };
      }

      const authData: AuthResponse = await response.json();

      // Сохраняем токены и данные пользователя
      localStorage.setItem('accessToken', authData.access);
      localStorage.setItem('refreshToken', authData.refresh);
      localStorage.setItem('user', JSON.stringify(authData.user));

      setAuthState({
        user: authData.user,
        accessToken: authData.access,
        refreshToken: authData.refresh,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const logout = async () => {
    try {
      if (authState.refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh: authState.refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Очищаем локальное хранилище и состояние
      localStorage.clear();
      setAuthState({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!authState.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: authState.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data: RefreshResponse = await response.json();

      // Обновляем access token
      localStorage.setItem('accessToken', data.access);
      setAuthState(prev => ({
        ...prev,
        accessToken: data.access,
      }));

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Если не удалось обновить токен, выходим из системы
      logout();
      return false;
    }
  };

  return {
    ...authState,
    login,
    logout,
    refreshAccessToken,
  };
};

// Провайдер контекста
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
