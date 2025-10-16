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
  sendPasswordReset: (userId: string) => Promise<{ success: boolean; error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (supabaseUser: SupabaseUser) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      return null;
    } else if (data) {
      // Map database snake_case to application camelCase
      const userProfile: User = {
          id: data.id,
          fullName: data.full_name || 'User', // Fallback to prevent crash if full_name is null
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
    return null;
  };
  
  // FIX: The onAuthStateChange listener has been wrapped in a try/finally block.
  // This guarantees that the `loading` state is set to `false` even if fetching
  // the user's profile fails due to corrupted session data or network errors.
  // This resolves the "blank screen" issue where the app would get stuck in a loading state.
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
            if (session) {
                await fetchUserProfile(session.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Critical error during authentication state change:", error);
            // If any part of the auth check fails, clear the session to be safe.
            setUser(null);
        } finally {
            // This `finally` block ensures the app is never stuck in a loading state.
            setLoading(false);
        }
      }
    );

    // The cleanup function unsubscribes from the listener when the component unmounts.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // The empty dependency array ensures this effect runs only once on component mount.

  const login = async (userId: string, password: string): Promise<{ success: boolean; error: string | null }> => {
    const trimmedUserId = userId.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Step 1: Find the user in the public.users table by their user_id to get their actual email.
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', trimmedUserId)
      .single();

    // Step 2: If no profile exists for that user_id, it's an invalid credential.
    if (profileError || !userProfile) {
      console.error("Login failed: No user profile found for user_id:", trimmedUserId);
      return { success: false, error: 'INVALID_CREDENTIALS' };
    }

    // Step 3: Use the ACTUAL email from the profile for authentication.
    // This is the key fix: it works for both "real" emails and "proxy" emails.
    const actualEmail = userProfile.email;
    if (!actualEmail) {
        console.error("Login failed: User profile has no email for user_id:", trimmedUserId);
        return { success: false, error: 'UNKNOWN_ERROR' };
    }
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: actualEmail,
      password: trimmedPassword,
    });

    // Step 4: Handle authentication errors.
    if (signInError) {
      console.error("AUTHENTICATION FAILED:", signInError.message);
      if (signInError.message.includes("Invalid login credentials")) {
         return { success: false, error: 'INVALID_CREDENTIALS' };
      }
      return { success: false, error: 'UNKNOWN_ERROR' };
    }

    // A successful login will trigger the onAuthStateChange listener,
    // which will then fetch the user profile and update the application state.
    return { success: true, error: null };
  };

  const logout = async () => {
    setLoading(true);
    try {
        await supabase.auth.signOut();
        setUser(null);
    } catch (error) {
        console.error("Error during logout:", error);
        setUser(null); // Still attempt to clear local session
    } finally {
        setLoading(false);
    }
  };
  
  const updateUser = (updates: Partial<User>) => {
      setUser(prevUser => prevUser ? { ...prevUser, ...updates } : null);
  };

  const sendPasswordReset = async (userId: string): Promise<{ success: boolean; error: string | null }> => {
    if (!userId.trim()) {
      return { success: false, error: 'User ID cannot be empty.' };
    }
    const trimmedUserId = userId.trim().toLowerCase();
    
    // Find the user's actual email to send the reset link to.
    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('email')
        .eq('user_id', trimmedUserId)
        .single();
    
    // If no user is found, we don't throw an error to prevent user enumeration.
    // The success message will handle this case gracefully.
    if (profileError || !userProfile?.email) {
        console.warn("Password reset attempted for non-existent user_id:", trimmedUserId);
        return { success: true, error: null };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(userProfile.email);

    if (error) {
        console.error("Password reset error:", error.message);
    }

    // Always return success to prevent user enumeration attacks.
    return { success: true, error: null };
  };

  const value = {
    user,
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