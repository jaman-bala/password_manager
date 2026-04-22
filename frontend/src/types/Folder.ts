// Folder types

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  user_id: number | null;
  organization_id: number | null;
  created_at: string;
  updated_at: string;
  icon: string | null;
  color: string | null;
  full_path: string | null;
}

export interface FolderCreate {
  name: string;
  parent_id?: number;
  organization_id?: number;
  icon?: string;
  color?: string;
}
