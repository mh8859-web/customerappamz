import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userId: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchAndMapProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

    if (error || !data) {
        console.error('Failed to fetch user profile:', error);
        return null;
    }
    
    return {
        id: data.id,
        fullName: data.full_name || 'User',
        email: data.email,
        role: data.role,
        avatarUrl: data.avatar_url,
        verified: data.verified,
        verificationRequested: data.verification_requested,
        userId: data.user_id,
    };
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout: If authentication hangs, force the UI to render after 4 seconds.
    const authTimeout = setTimeout(() => {
        if (loading) {
            console.warn("Authentication check timed out. Forcing UI render.");
            setLoading(false);
        }
    }, 4000);

    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const profile = await fetchAndMapProfile(session.user);
            setUser(profile);
        }
      } catch (e) {
        console.error("Error initializing session:", e);
        setUser(null);
      } finally {
        clearTimeout(authTimeout); // Clear the safety net if auth completes
        setLoading(false); // Signal that the auth check is complete
      }
    };
    
    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchAndMapProfile(session.user);
          setUser(profile);
        }
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      clearTimeout(authTimeout); // Cleanup on unmount
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (userId: string, password: string): Promise<{ success: boolean; error: string | null }> => {
    try {
        const trimmedUserId = userId.trim().toLowerCase();
        
        const { data: profileForEmail, error: profileError } = await supabase
          .from('users')
          .select('email')
          .eq('user_id', trimmedUserId)
          .single();

        if (profileError || !profileForEmail?.email) {
          console.error("Login failed: No user profile found for user_id:", trimmedUserId);
          return { success: false, error: 'INVALID_CREDENTIALS' };
        }
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: profileForEmail.email,
          password: password.trim(),
        });

        if (signInError || !data.user) {
          console.error("AUTHENTICATION FAILED:", signInError?.message);
          return { success: false, error: 'INVALID_CREDENTIALS' };
        }

        const userProfile = await fetchAndMapProfile(data.user);
        
        if (userProfile) {
            setUser(userProfile);
            return { success: true, error: null };
        } else {
            await supabase.auth.signOut();
            setUser(null);
            return { success: false, error: 'PROFILE_FETCH_FAILED' };
        }

    } catch (e) {
        console.error("An unexpected error occurred during login:", e);
        return { success: false, error: 'UNKNOWN_ERROR' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };
  
  const updateUser = (updates: Partial<User>) => {
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
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