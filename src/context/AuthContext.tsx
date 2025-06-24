
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  updateTokenExpiry: (userId: string, newExpiry: Date) => Promise<boolean>;
  getAllUsers: () => Promise<User[]>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função para limpar estado de autenticação
const cleanupAuthState = () => {
  console.log('Cleaning up auth state...');
  
  // Remove standard auth tokens
  localStorage.removeItem('supabase.auth.token');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        // Defer profile loading to prevent deadlocks
        setTimeout(async () => {
          if (mounted) {
            await loadUserProfile(session.user);
          }
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        setLoading(false);
      } else if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          setTimeout(async () => {
            if (mounted) {
              await loadUserProfile(session.user);
            }
          }, 100);
        } else {
          setLoading(false);
        }
      }
    });

    // THEN check for existing session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session:', session?.user?.id);
        
        if (session?.user && mounted) {
          await loadUserProfile(session.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser, retryCount = 0) => {
    const maxRetries = 5;
    
    try {
      console.log('Loading profile for user:', supabaseUser.id, 'Retry:', retryCount);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Profile loading error:', error);
        
        // Se o perfil não existe e ainda há tentativas, aguarda um pouco e tenta novamente
        if (error.code === 'PGRST116' && retryCount < maxRetries) {
          console.log('Profile not found, retrying in 1 second...');
          setTimeout(() => {
            loadUserProfile(supabaseUser, retryCount + 1);
          }, 1000);
          return;
        }
        
        // Se esgotaram as tentativas, define estado sem perfil
        console.error('Profile not found after retries or other error:', error);
        setLoading(false);
        return;
      }

      if (profile) {
        const user: User = {
          id: profile.id,
          name: profile.name || 'Usuário',
          cpf: profile.cpf || '',
          company: profile.company || 'Empresa',
          username: profile.username || '',
          email: supabaseUser.email || profile.email || '',
          role: profile.role || 'user',
          tokenExpiry: profile.token_expiry ? new Date(profile.token_expiry) : null,
          createdAt: new Date(profile.created_at),
          lastLogin: profile.last_login ? new Date(profile.last_login) : undefined,
        };

        console.log('Profile loaded successfully:', user.name, user.role);

        setAuthState({
          user,
          token: supabaseUser.id,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      
      // Clean up existing state before login
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Global signout error (expected):', err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      if (data.user) {
        // Update last login
        try {
          await supabase.rpc('update_last_login', { user_id: data.user.id });
        } catch (rpcError) {
          console.error('Error updating last login:', rpcError);
        }
        
        // Force page reload for clean state
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
        
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
      console.log('Attempting registration for:', userData.email);
      
      // Clean up existing state before registration
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Global signout error (expected):', err);
      }

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name || 'Usuário',
            cpf: userData.cpf || '',
            company: userData.company || 'Empresa',
            username: userData.username || '',
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      console.log('Registration successful:', data.user?.id);
      
      // Se o usuário foi criado com sucesso, tenta fazer login automaticamente
      if (data.user && !data.user.email_confirmed_at) {
        console.log('User created but needs email confirmation');
        return true;
      } else if (data.user) {
        // Usuário criado e confirmado automaticamente
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
        return true;
      }

      return !!data.user;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const updateTokenExpiry = async (userId: string, newExpiry: Date): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ token_expiry: newExpiry.toISOString() })
        .eq('id', userId);

      if (error) {
        console.error('Token update error:', error);
        return false;
      }

      if (authState.user?.id === userId) {
        setAuthState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, tokenExpiry: newExpiry } : null,
        }));
      }

      return true;
    } catch (error) {
      console.error('Token update error:', error);
      return false;
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }

      return profiles.map(profile => ({
        id: profile.id,
        name: profile.name || 'Usuário',
        cpf: profile.cpf || '',
        company: profile.company || 'Empresa',
        username: profile.username || '',
        email: profile.email || '',
        role: profile.role || 'user',
        tokenExpiry: profile.token_expiry ? new Date(profile.token_expiry) : null,
        createdAt: new Date(profile.created_at),
        lastLogin: profile.last_login ? new Date(profile.last_login) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      
      // Clean up auth state first
      cleanupAuthState();
      
      // Sign out from Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page refresh for clean state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Force cleanup even if signout fails
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      register,
      updateTokenExpiry,
      getAllUsers,
      loading,
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
