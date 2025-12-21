import { useState, useEffect } from 'react';
import { PasswordEntry, PasswordFormData } from '../types/Password';
import { useAuth } from './useAuth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

interface APIResponse<T> {
  data?: T;
  error?: string;
}

export const usePasswordAPI = () => {
  const { accessToken, refreshAccessToken } = useAuth();
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Функция для создания заголовков с токеном
  const getAuthHeaders = () => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return headers;
  };

  // Загрузить все пароли
  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/index/products`, {
        headers: getAuthHeaders(),
      });
      
      if (response.status === 401) {
        // Попробуем обновить токен
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Повторяем запрос с новым токеном
          const retryResponse = await fetch(`${API_BASE_URL}/api/index/products`, {
            headers: getAuthHeaders(),
          });
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          const retryData = await retryResponse.json();
          const formattedEntries: PasswordEntry[] = retryData;
          setEntries(formattedEntries);
          return;
        } else {
          throw new Error('Authentication failed');
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Данные уже в правильном формате
      const formattedEntries: PasswordEntry[] = data;
      
      setEntries(formattedEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      console.error('Error fetching entries:', err);
    } finally {
      setLoading(false);
    }
  };

  // Добавить новый пароль
  const addEntry = async (data: PasswordFormData): Promise<APIResponse<PasswordEntry>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/index/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setEntries(prev => [...prev, result]);
      return { data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания записи';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Обновить пароль
  const updateEntry = async (id: string, data: PasswordFormData): Promise<APIResponse<PasswordEntry>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/index/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setEntries(prev => {
        const updated = prev.map(entry => 
          entry.id === parseInt(id) ? result : entry
        );
        return updated;
      });
      
      // Дополнительно обновляем список через fetch для гарантии
      setTimeout(() => {
        fetchEntries();
      }, 100);
      
      return { data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления записи';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Удалить пароль
  const deleteEntry = async (id: string): Promise<APIResponse<boolean>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/index/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEntries(prev => prev.filter(entry => entry.id !== parseInt(id)));
      return { data: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления записи';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Поиск паролей
  const searchEntries = (query: string): PasswordEntry[] => {
    if (!query) return entries;
    
    const lowercaseQuery = query.toLowerCase();
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(lowercaseQuery) ||
      entry.login.toLowerCase().includes(lowercaseQuery) ||
      (entry.url && entry.url.toLowerCase().includes(lowercaseQuery)) ||
      (entry.description && entry.description.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Загрузить данные при инициализации
  useEffect(() => {
    // Загружаем данные только если пользователь аутентифицирован
    if (accessToken) {
      fetchEntries();
    }
  }, [accessToken]);

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    refreshEntries: fetchEntries
  };
};
