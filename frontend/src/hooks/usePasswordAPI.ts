import { useState, useEffect, useCallback } from 'react';
import { PasswordEntry, PasswordFormData, Category, PaginatedResponse, PaginationParams } from '../types/Password';
import { useAuth } from './useAuth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8002';

interface APIResponse<T> {
  data?: T;
  error?: string;
}

export const usePasswordAPI = () => {
  const { accessToken, refreshAccessToken } = useAuth();
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Загрузить все категории
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/index/categories`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Загрузить пароли с пагинацией
  const fetchEntries = useCallback(async (params?: PaginationParams) => {
    const currentPage = params?.page || page;
    const currentLimit = params?.limit || limit;
    const currentSearch = params?.search || searchQuery;
    
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
      });
      
      if (currentSearch) {
        queryParams.append('search', currentSearch);
      }

      const response = await fetch(`${API_BASE_URL}/api/index/products?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Authentication failed');
        }
        // Повторяем запрос с новым токеном
        const retryResponse = await fetch(`${API_BASE_URL}/api/index/products?${queryParams}`, {
          headers: getAuthHeaders(),
        });
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        const retryData: PaginatedResponse<PasswordEntry> = await retryResponse.json();
        setEntries(retryData.items);
        setTotal(retryData.total);
        setTotalPages(retryData.total_pages);
        setPage(retryData.page);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PaginatedResponse<PasswordEntry> = await response.json();
      setEntries(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки данных');
      console.error('Error fetching entries:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, limit, searchQuery]);

  // Перейти на страницу
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchEntries({ page: newPage, limit, search: searchQuery });
    }
  };

  // Изменить лимит
  const changeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchEntries({ page: 1, limit: newLimit, search: searchQuery });
  };

  // Поиск с пагинацией
  const search = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    fetchEntries({ page: 1, limit, search: query });
  };

  // Создать новую категорию
  const createCategory = async (name: string): Promise<APIResponse<Category>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/index/categories`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Authentication failed');
        }
        const retryResponse = await fetch(`${API_BASE_URL}/api/index/categories`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ name }),
        });
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        const result = await retryResponse.json();
        setCategories(prev => [...prev, result]);
        return { data: result };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setCategories(prev => [...prev, result]);
      return { data: result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания категории';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Удалить категорию
  const deleteCategory = async (id: number): Promise<APIResponse<boolean>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/index/categories/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Authentication failed');
        }
        const retryResponse = await fetch(`${API_BASE_URL}/api/index/categories/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        setCategories(prev => prev.filter(cat => cat.id !== id));
        return { data: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setCategories(prev => prev.filter(cat => cat.id !== id));
      return { data: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления категории';
      setError(errorMessage);
      return { error: errorMessage };
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

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Authentication failed');
        }
        const retryResponse = await fetch(`${API_BASE_URL}/api/index/products`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        const result = await retryResponse.json();
        // Refresh current page to show new entry
        fetchEntries();
        return { data: result };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      fetchEntries();
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

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Authentication failed');
        }
        const retryResponse = await fetch(`${API_BASE_URL}/api/index/products/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(data),
        });
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        const result = await retryResponse.json();
        setEntries(prev => prev.map(entry => entry.id === parseInt(id) ? result : entry));
        return { data: result };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setEntries(prev => prev.map(entry => entry.id === parseInt(id) ? result : entry));
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

      if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          throw new Error('Authentication failed');
        }
        const retryResponse = await fetch(`${API_BASE_URL}/api/index/products/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!retryResponse.ok) {
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        setEntries(prev => prev.filter(entry => entry.id !== parseInt(id)));
        // Refresh to maintain correct pagination
        fetchEntries();
        return { data: true };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEntries(prev => prev.filter(entry => entry.id !== parseInt(id)));
      fetchEntries();
      return { data: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка удаления записи';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Локальный поиск в текущей странице
  const searchEntries = (query: string): PasswordEntry[] => {
    if (!query) return entries;

    const lowercaseQuery = query.toLowerCase();
    return entries.filter(entry =>
      entry.title?.toLowerCase().includes(lowercaseQuery) ||
      entry.login?.toLowerCase().includes(lowercaseQuery) ||
      entry.url?.toLowerCase().includes(lowercaseQuery) ||
      entry.notes?.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Загрузить данные при инициализации
  useEffect(() => {
    if (accessToken) {
      fetchCategories();
      fetchEntries();
    }
  }, [accessToken]);

  return {
    entries,
    categories,
    loading,
    error,
    // Pagination
    page,
    limit,
    total,
    totalPages,
    goToPage,
    changeLimit,
    search,
    // Actions
    addEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    refreshEntries: fetchEntries,
    fetchCategories,
    createCategory,
    deleteCategory
  };
};
