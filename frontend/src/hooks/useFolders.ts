import { useState, useCallback } from 'react';
import { Folder, FolderCreate } from '../types/Folder';

const API_BASE_URL = '/api/folders';

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
  });

  // Get folders
  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/folders`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      const data = await response.json();
      setFolders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки папок');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get folder by ID
  const fetchFolder = useCallback(async (folderId: number): Promise<Folder | { error: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Ошибка загрузки папки' };
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      return { error: err instanceof Error ? err.message : 'Ошибка сети' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create folder
  const createFolder = useCallback(async (data: FolderCreate): Promise<Folder | { error: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/folders`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Ошибка создания папки' };
      }

      const folder = await response.json();
      setFolders(prev => [...prev, folder]);
      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Update folder
  const updateFolder = useCallback(async (folderId: number, data: FolderCreate): Promise<Folder | { error: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Ошибка обновления папки' };
      }

      const folder = await response.json();
      setFolders(prev => prev.map(f => f.id === folderId ? folder : f));
      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete folder
  const deleteFolder = useCallback(async (folderId: number): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка удаления папки' };
      }

      setFolders(prev => prev.filter(f => f.id !== folderId));
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    folders,
    loading,
    error,
    fetchFolders,
    fetchFolder,
    createFolder,
    updateFolder,
    deleteFolder,
  };
};
