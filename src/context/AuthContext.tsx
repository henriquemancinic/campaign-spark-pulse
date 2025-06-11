
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
  isTokenValid: () => boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Use setTimeout to prevent potential deadlocks
        setTimeout(() => {
          loadUserProfile(session.user);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      console.log('Loading profile for user:', supabaseUser.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        const user: User = {
          id: profile.id,
          name: profile.name,
          cpf: profile.cpf,
          company: profile.company,
          username: profile.username,
          email: supabaseUser.email,
          role: profile.role,
          tokenExpiry: new Date(profile.token_expiry),
          createdAt: new Date(profile.created_at),
          lastLogin: profile.last_login ? new Date(profile.last_login) : undefined,
        };

        setAuthState({
          user,
          token: supabaseUser.id,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      
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
          // Don't fail login if last login update fails
        }
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
      
      // Clean up auth state before registration
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            cpf: userData.cpf,
            company: userData.company,
            username: userData.username,
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      console.log('Registration successful:', data.user?.id);
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

      // Update current auth state if it's the current user
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
        name: profile.name,
        cpf: profile.cpf,
        company: profile.company,
        username: profile.username,
        role: profile.role,
        tokenExpiry: new Date(profile.token_expiry),
        createdAt: new Date(profile.created_at),
        lastLogin: profile.last_login ? new Date(profile.last_login) : undefined,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const isTokenValid = (): boolean => {
    return authState.user ? new Date(authState.user.tokenExpiry) > new Date() : false;
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
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
