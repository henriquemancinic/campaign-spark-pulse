
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  updateTokenExpiry: (userId: string, newExpiry: Date) => Promise<boolean>;
  getAllUsers: () => User[];
  isTokenValid: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Check for stored auth data on component mount
    const storedAuth = localStorage.getItem('emailMarketingAuth');
    if (storedAuth) {
      const parsedAuth = JSON.parse(storedAuth);
      if (new Date(parsedAuth.user.tokenExpiry) > new Date()) {
        setAuthState({
          ...parsedAuth,
          user: {
            ...parsedAuth.user,
            tokenExpiry: new Date(parsedAuth.user.tokenExpiry),
            createdAt: new Date(parsedAuth.user.createdAt),
            lastLogin: parsedAuth.user.lastLogin ? new Date(parsedAuth.user.lastLogin) : undefined,
          },
          isAuthenticated: true,
        });
      } else {
        localStorage.removeItem('emailMarketingAuth');
      }
    }
  }, []);

  const generateToken = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Get users from localStorage
      const usersData = localStorage.getItem('emailMarketingUsers');
      const users: User[] = usersData ? JSON.parse(usersData) : [];
      
      const user = users.find(u => u.username === username);
      
      if (user && new Date(user.tokenExpiry) > new Date()) {
        const token = generateToken();
        const updatedUser = {
          ...user,
          lastLogin: new Date(),
          tokenExpiry: new Date(user.tokenExpiry),
          createdAt: new Date(user.createdAt),
        };
        
        const newAuthState = {
          user: updatedUser,
          token,
          isAuthenticated: true,
        };
        
        setAuthState(newAuthState);
        localStorage.setItem('emailMarketingAuth', JSON.stringify(newAuthState));
        
        // Update user's last login
        const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
        localStorage.setItem('emailMarketingUsers', JSON.stringify(updatedUsers));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const usersData = localStorage.getItem('emailMarketingUsers');
      const users: User[] = usersData ? JSON.parse(usersData) : [];
      
      // Check if username already exists
      if (users.some(u => u.username === userData.username)) {
        return false;
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        cpf: userData.cpf,
        company: userData.company,
        username: userData.username,
        role: users.length === 0 ? 'admin' : 'user', // First user is admin
        tokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
      };
      
      users.push(newUser);
      localStorage.setItem('emailMarketingUsers', JSON.stringify(users));
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const updateTokenExpiry = async (userId: string, newExpiry: Date): Promise<boolean> => {
    try {
      const usersData = localStorage.getItem('emailMarketingUsers');
      const users: User[] = usersData ? JSON.parse(usersData) : [];
      
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, tokenExpiry: newExpiry } : user
      );
      
      localStorage.setItem('emailMarketingUsers', JSON.stringify(updatedUsers));
      
      // Update current auth state if it's the current user
      if (authState.user?.id === userId) {
        const updatedAuthState = {
          ...authState,
          user: { ...authState.user, tokenExpiry: newExpiry },
        };
        setAuthState(updatedAuthState);
        localStorage.setItem('emailMarketingAuth', JSON.stringify(updatedAuthState));
      }
      
      return true;
    } catch (error) {
      console.error('Token update error:', error);
      return false;
    }
  };

  const getAllUsers = (): User[] => {
    const usersData = localStorage.getItem('emailMarketingUsers');
    return usersData ? JSON.parse(usersData) : [];
  };

  const isTokenValid = (): boolean => {
    return authState.user ? new Date(authState.user.tokenExpiry) > new Date() : false;
  };

  const logout = () => {
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('emailMarketingAuth');
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      register,
      updateTokenExpiry,
      getAllUsers,
      isTokenValid,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
