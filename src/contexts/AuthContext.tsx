import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { getCurrentUser, getUserRole, signIn, signOut } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for user on initial load
    const loadUser = async () => {
      try {
        const { data: { user: authUser } } = await getCurrentUser();
        
        if (authUser) {
          const role = await getUserRole() as UserRole;
          
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            role: role || 'customer',
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Logging in with email:', email);
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      if (data.user) {
        console.log('User authenticated:', data.user.email);
        const role = await getUserRole() as UserRole;
        console.log('Role after getUserRole:', role);
        
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          role: role || 'customer',
        });
        
        console.log('User state set with role:', role);
      }

      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error };
    }
  };

  const logout = async () => {
    await signOut();
    setUser(null);
  };

  const isAdmin = user?.role ? user.role.toLowerCase() === 'admin' : false;
  const isCustomer = user?.role ? user.role.toLowerCase() === 'customer' : false;

  const value = {
    user,
    loading,
    isAdmin,
    isCustomer,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
