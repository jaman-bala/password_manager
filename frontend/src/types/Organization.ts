// Organization types

export interface Organization {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface OrganizationCreate {
  name: string;
  description?: string;
}

export interface OrganizationMember {
  id: number;
  user_id: number;
  username: string;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
}

export interface Vault {
  id: number;
  name: string;
  description: string | null;
  organization_id: number;
  created_by_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface VaultCreate {
  name: string;
  description?: string;
  organization_id: number;
}

export interface VaultAccess {
  id: number;
  vault_id: number;
  user_id: number;
  username: string;
  permission: 'read' | 'write' | 'admin';
  granted_at: string;
}

export interface VaultGrantAccess {
  user_id: number;
  permission: 'read' | 'write' | 'admin';
}
