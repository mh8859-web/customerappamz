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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to fetch and map a user profile from the 'users' table.
// This function has no side effects.
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

  useEffect(() => {
    // On initial app load, check for an existing session.
    const initializeSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const profile = await fetchAndMapProfile(session.user);
            setUser(profile); // If profile is null, user is effectively logged out.
        }
    };
    
    initializeSession();

    // Listen for auth events that happen outside the app's direct control, like logout.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
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

        if (signInError || !data.user) {
          console.error("AUTHENTICATION FAILED:", signInError?.message);
          return { success: false, error: 'INVALID_CREDENTIALS' };
        }

        // After successful auth, fetch the user profile to complete the login process.
        const userProfile = await fetchAndMapProfile(data.user);
        
        if (userProfile) {
            setUser(userProfile); // Set the user state for the app
            return { success: true, error: null };
        } else {
            // This is a critical error: auth succeeded but profile is missing.
            // Clean up by signing the user out to prevent a broken state.
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
    // The onAuthStateChange listener will handle setting the user to null.
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
        // Don't reveal if a user exists or not for security reasons.
        console.warn("Password reset attempted for non-existent user_id:", trimmedUserId);
        return { success: true, error: null };
    }

    await supabase.auth.resetPasswordForEmail(userProfile.email);

    return { success: true, error: null };
  };

  const value = {
    user,
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