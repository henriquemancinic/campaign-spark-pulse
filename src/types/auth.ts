
export interface User {
  id: string;
  name: string;
  cpf: string;
  company: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  tokenExpiry: Date | null;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  cpf: string;
  company: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}
