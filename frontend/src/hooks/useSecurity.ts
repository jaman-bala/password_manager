import { useState } from 'react';
import {
  MasterPasswordSetup,
  MasterPasswordVerify,
  TwoFactorSetup,
  TwoFactorVerify,
  PasswordBreachCheck,
  PasswordBreachResponse,
  TwoFactorStatus,
  TwoFactorSetupResponse,
  TwoFactorEnableResponse
} from '../types/Security';

const API_BASE_URL = '/api/security';

export const useSecurity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
  });

  // Setup master password
  const setupMasterPassword = async (data: MasterPasswordSetup): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/master-password/setup`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка настройки мастер-пароля' };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Verify master password
  const verifyMasterPassword = async (data: MasterPasswordVerify): Promise<{ success: boolean; verified: boolean }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/master-password/verify`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      return { success: false, verified: false };
    } finally {
      setLoading(false);
    }
  };

  // Setup 2FA
  const setupTwoFactor = async (): Promise<TwoFactorSetupResponse | { error: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/2fa/setup`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Ошибка настройки 2FA' };
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      return { error: err instanceof Error ? err.message : 'Ошибка сети' };
    } finally {
      setLoading(false);
    }
  };

  // Enable 2FA
  const enableTwoFactor = async (data: TwoFactorSetup): Promise<TwoFactorEnableResponse | { error: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/2fa/enable`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Ошибка включения 2FA' };
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      return { error: err instanceof Error ? err.message : 'Ошибка сети' };
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const disableTwoFactor = async (data: TwoFactorVerify): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/2fa/disable`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка отключения 2FA' };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Get 2FA status
  const getTwoFactorStatus = async (): Promise<TwoFactorStatus> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/2fa/status`, {
        headers: getHeaders(),
        credentials: 'include',
      });

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      return { enabled: false, has_backup_codes: false };
    } finally {
      setLoading(false);
    }
  };

  // Check password breach
  const checkPasswordBreach = async (data: PasswordBreachCheck): Promise<PasswordBreachResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/check-breach`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      return { is_breached: false, count: 0 };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setupMasterPassword,
    verifyMasterPassword,
    setupTwoFactor,
    enableTwoFactor,
    disableTwoFactor,
    getTwoFactorStatus,
    checkPasswordBreach,
  };
};
