export interface Category {
  id: number;
  name: string;
  created_at: string;
  edited_at: string;
}

export interface PasswordEntry {
  id: number;
  title?: string;
  url?: string;
  login?: string;
  password?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface PasswordFormData {
  title?: string;
  url?: string;
  login?: string;
  password?: string;
  notes?: string;
  category_id?: number;
}