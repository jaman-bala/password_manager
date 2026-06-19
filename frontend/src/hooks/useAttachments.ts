import { Attachment } from '../types/Attachment';

const API_BASE = '/api/index';

interface Result<T> {
  data?: T;
  error?: string;
}

export const useAttachments = () => {
  const fetchAttachments = async (productId: number): Promise<Attachment[]> => {
    try {
      const res = await fetch(`${API_BASE}/products/${productId}/attachments`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  };

  const uploadAttachments = async (productId: number, files: File[]): Promise<Result<Attachment[]>> => {
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));

      const res = await fetch(`${API_BASE}/products/${productId}/attachments`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        return { error: text || 'Ошибка загрузки файлов' };
      }
      return { data: await res.json() };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Ошибка загрузки файлов' };
    }
  };

  const deleteAttachment = async (attachmentId: number): Promise<Result<boolean>> => {
    try {
      const res = await fetch(`${API_BASE}/attachments/${attachmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) return { error: 'Не удалось удалить вложение' };
      return { data: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Ошибка удаления' };
    }
  };

  const getDownloadUrl = (attachmentId: number) =>
    `${API_BASE}/attachments/${attachmentId}/download`;

  return { fetchAttachments, uploadAttachments, deleteAttachment, getDownloadUrl };
};