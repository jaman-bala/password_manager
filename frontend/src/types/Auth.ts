export interface LoginData {
  username: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  fio: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshResponse {
  access: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Deprecated: AuthResponse and RefreshResponse not needed with httpOnly cookies
export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RefreshResponse {
  access: string;
}
