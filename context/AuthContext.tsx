import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { User } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (userId: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  sendPasswordReset: (userId: string) => Promise<{ success: boolean; error: string | null }>;
  // FIX: Add loading property to the context type.
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // FIX: Add loading state to track session initialization.
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
    if (!supabaseUser) {
      setUser(null);
      return null;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      await supabase.auth.signOut();
      setUser(null);
      return null;
    } 
    
    if (data) {
      const userProfile: User = {
          id: data.id,
          fullName: data.full_name || 'User',
          email: data.email,
          role: data.role,
          avatarUrl: data.avatar_url,
          verified: data.verified,
          verificationRequested: data.verification_requested,
          userId: data.user_id,
      };
      setUser(userProfile);
      return userProfile;
    }

    await supabase.auth.signOut();
    setUser(null);
    return null;
  };
  
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            throw new Error(`Supabase getSession error: ${error.message}`);
        }
        await fetchUserProfile(session?.user ?? null);
      } catch (e) {
        console.error("Critical error during session initialization. Forcing logout.", e);
        setUser(null);
      } finally {
        // FIX: Set loading to false after the session has been checked.
        setLoading(false);
      }
    };
    
    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          await fetchUserProfile(session!.user);
        }
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
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

        if (signInError) {
          console.error("AUTHENTICATION FAILED:", signInError.message);
          if (signInError.message.includes("Invalid login credentials")) {
             return { success: false, error: 'INVALID_CREDENTIALS' };
          }
          return { success: false, error: 'UNKNOWN_ERROR' };
        }

        if (data.session) {
            const profile = await fetchUserProfile(data.session.user);
            if (profile) {
                return { success: true, error: null };
            } else {
                return { success: false, error: 'PROFILE_FETCH_FAILED' };
            }
        }
        
        return { success: false, error: 'UNKNOWN_ERROR' };

    } catch (e) {
        console.error("An unexpected error occurred during login:", e);
        return { success: false, error: 'UNKNOWN_ERROR' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };
  
  const updateUser = (updates: Partial<User>) => {
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
  };

  const sendPasswordReset = async (userId: string): Promise<{ success: boolean; error: string | null }> => {
    if (!userId.trim()) {
      return { success: false, error: 'User ID cannot be empty.' };
    }
    const trimmedUserId = userId.trim().toLowerCase();
    
    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('email')
        .eq('user_id', trimmedUserId)
        .single();
    
    if (profileError || !userProfile?.email) {
        console.warn("Password reset attempted for non-existent user_id:", trimmedUserId);
        return { success: true, error: null };
    }

    await supabase.auth.resetPasswordForEmail(userProfile.email);

    return { success: true, error: null };
  };

  const value = {
    user,
    // FIX: Expose loading state in the context value.
    loading,
    login,
    logout,
    updateUser,
    sendPasswordReset,
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