import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { LoginData, User, AuthState } from '../types/Auth';

const API_BASE_URL = '/api';

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<{ success: boolean; error?: string; requires_2fa?: boolean }>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Django Ninja кладёт текст ошибки в `detail` (строка, а для ошибок валидации — массив),
// rate limit middleware — в `error`. Если внятного текста нет, подбираем по статусу.
const getLoginErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = await response.json();
    const message = typeof body?.detail === 'string' ? body.detail : body?.error;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  } catch {
    // Тело не JSON (например, HTML-страница 502 от nginx) — используем текст по статусу
  }

  if (response.status === 401) return 'Неверное имя пользователя или пароль';
  if (response.status === 422) return 'Заполните имя пользователя и пароль';
  if (response.status === 429) return 'Слишком много попыток входа. Подождите несколько минут и попробуйте снова.';
  if (response.status >= 500) return 'Сервер временно недоступен. Попробуйте позже.';
  return 'Не удалось войти. Попробуйте ещё раз.';
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [authState, setAuthState] = useState<Omit<AuthState, 'accessToken' | 'refreshToken'>>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Пробуем получить текущего пользователя
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',  // Отправляем куки
        });

        if (response.ok) {
          const user = await response.json();
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else if (response.status === 401) {
          // Пробуем обновить токен
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            // Повторяем запрос
            const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
              credentials: 'include',
            });
            if (retryResponse.ok) {
              const user = await retryResponse.json();
              setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            }
          }
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        } else {
          setAuthState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } catch {
        setAuthState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginData): Promise<{ success: boolean; error?: string; requires_2fa?: boolean }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Важно для получения куки
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        return { success: false, error: await getLoginErrorMessage(response) };
      }

      const responseData = await response.json();

      // Проверяем, требуется ли 2FA
      if (responseData.requires_2fa) {
        return { success: false, requires_2fa: true };
      }

      setAuthState({
        user: responseData,
        isAuthenticated: true,
        isLoading: false,
      });

      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка сети' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',  // Отправляем куки для очистки
      });
    } catch {
      // Logout error - continue with local cleanup
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',  // Отправляем refresh куку
      });

      return response.ok;
    } catch {
      return false;
    }
  }, []);

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
