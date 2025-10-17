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
  
  useEffect(() => {
    // FIX: Added a timeout to ensure the app never gets stuck in a loading state.
    // On a hard refresh, if the onAuthStateChange listener fails to fire for any reason,
    // this timeout will force the loading state to false, preventing a permanent blank screen.
    const authTimeout = setTimeout(() => {
        if (loading) {
            console.warn("Authentication timed out. Clearing loading state.");
            setLoading(false);
        }
    }, 5000); // 5-second timeout

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        clearTimeout(authTimeout); // We got a response, so clear the safety timeout.
        try {
            if (session) {
                await fetchUserProfile(session.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Critical error during authentication state change:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
      }
    );

    return () => {
      clearTimeout(authTimeout);
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

    if (profileError || !userProfile) {
      console.error("Login failed: No user profile found for user_id:", trimmedUserId);
      return { success: false, error: 'INVALID_CREDENTIALS' };
    }

    const actualEmail = userProfile.email;
    if (!actualEmail) {
        console.error("Login failed: User profile has no email for user_id:", trimmedUserId);
        return { success: false, error: 'UNKNOWN_ERROR' };
    }
    
    // Step 2: Use the email to sign in.
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: actualEmail,
      password: trimmedPassword,
    });

    if (signInError) {
      console.error("AUTHENTICATION FAILED:", signInError.message);
      if (signInError.message.includes("Invalid login credentials")) {
         return { success: false, error: 'INVALID_CREDENTIALS' };
      }
      return { success: false, error: 'UNKNOWN_ERROR' };
    }

    // Step 3: Proactively fetch the user profile on successful login.
    // This is more robust than relying only on the onAuthStateChange listener,
    // which can sometimes have a delay or fail to fire, causing a "stuck" login screen.
    if (signInData.user) {
        await fetchUserProfile(signInData.user);
    } else {
        // This case should be rare, but it's a safeguard.
        return { success: false, error: 'UNKNOWN_ERROR' };
    }

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