export interface PasswordEntry {
  id: number;
  title?: string;
  url?: string;
  login?: string;
  password?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
  };
}

export interface PasswordFormData {
  title?: string;
  url?: string;
  login?: string;
  password?: string;
  notes?: string;
  category_id?: number;
}