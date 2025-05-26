
export interface User {
  id: string;
  name: string;
  cpf: string;
  company: string;
  username: string;
  email?: string;
  role: 'user' | 'admin';
  tokenExpiry: Date;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  name: string;
  cpf: string;
  company: string;
  username: string;
  password: string;
  confirmPassword: string;
}
