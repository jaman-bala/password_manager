import { useState, useCallback } from 'react';
import {
  Organization,
  OrganizationCreate,
  OrganizationMember,
  Vault,
  VaultCreate,
  VaultAccess,
  VaultGrantAccess
} from '../types/Organization';

const API_BASE_URL = '/api/organizations';

export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHeaders = () => ({
    'Content-Type': 'application/json',
  });

  // Get organizations
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/organizations`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки организаций');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create organization
  const createOrganization = useCallback(async (data: OrganizationCreate): Promise<Organization | { error: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/organizations`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Ошибка создания организации' };
      }

      const org = await response.json();
      setOrganizations(prev => [...prev, org]);
      return org;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get organization members
  const fetchOrganizationMembers = useCallback(async (orgId: number): Promise<OrganizationMember[] | { error: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/members`, {
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Ошибка загрузки членов' };
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      return { error: err instanceof Error ? err.message : 'Ошибка сети' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Add organization member
  const addOrganizationMember = useCallback(async (orgId: number, userId: number, role: string = 'member'): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/members?user_id=${userId}&role=${role}`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка добавления члена' };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove organization member
  const removeOrganizationMember = useCallback(async (orgId: number, memberId: number): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/organizations/${orgId}/members/${memberId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка удаления члена' };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get vaults
  const fetchVaults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/vaults`, {
        headers: getHeaders(),
        credentials: 'include',
      });
      const data = await response.json();
      setVaults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки сейфов');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create vault
  const createVault = useCallback(async (data: VaultCreate): Promise<Vault | { error: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/vaults`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Ошибка создания сейфа' };
      }

      const vault = await response.json();
      setVaults(prev => [...prev, vault]);
      return vault;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get vault access
  const fetchVaultAccess = useCallback(async (vaultId: number): Promise<VaultAccess[] | { error: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/access`, {
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Ошибка загрузки доступа' };
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сети');
      return { error: err instanceof Error ? err.message : 'Ошибка сети' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Grant vault access
  const grantVaultAccess = useCallback(async (vaultId: number, data: VaultGrantAccess): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/access`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка предоставления доступа' };
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сети';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Revoke vault access
  const revokeVaultAccess = useCallback(async (vaultId: number, accessId: number): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/vaults/${vaultId}/access/${accessId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Ошибка отзыва доступа' };
      }

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
    organizations,
    vaults,
    loading,
    error,
    fetchOrganizations,
    createOrganization,
    fetchOrganizationMembers,
    addOrganizationMember,
    removeOrganizationMember,
    fetchVaults,
    createVault,
    fetchVaultAccess,
    grantVaultAccess,
    revokeVaultAccess,
  };
};
