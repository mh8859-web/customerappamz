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
  const [loading, setLoading] = useState(true); // Start loading immediately

  // This is the single source of truth for fetching a user's profile from the DB
  // and setting the application's user state.
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
      // If profile fetch fails, we must sign out to prevent an inconsistent state.
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

    // This case means a user exists in auth.users but not in public.users
    // This is a critical data integrity issue, so we log them out.
    await supabase.auth.signOut();
    setUser(null);
    return null;
  };
  
  // This effect runs only once on app startup to handle the initial session check.
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Proactively get the session from local storage.
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            throw new Error(`Supabase getSession error: ${error.message}`);
        }
        // fetchUserProfile will handle setting the user state or null.
        await fetchUserProfile(session?.user ?? null);
      } catch (e) {
        console.error("Critical error during session initialization. Forcing logout.", e);
        // If anything fails (e.g., corrupted local storage), clear the session.
        setUser(null);
      } finally {
        // The initial authentication check is complete.
        setLoading(false);
      }
    };
    
    initializeSession();

    // This listener handles all subsequent auth changes (sign in, sign out, token refresh).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // On SIGNED_IN, the session is guaranteed to be available.
        if (event === 'SIGNED_IN') {
          setLoading(true);
          await fetchUserProfile(session!.user);
          setLoading(false);
        }
        // On SIGNED_OUT, clear the user state.
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once.

  // The login function is now simplified. It only handles the authentication call.
  // The onAuthStateChange listener above will handle the result.
  const login = async (userId: string, password: string): Promise<{ success: boolean; error: string | null }> => {
    const trimmedUserId = userId.trim().toLowerCase();
    
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('email')
      .eq('user_id', trimmedUserId)
      .single();

    if (profileError || !userProfile?.email) {
      console.error("Login failed: No user profile found for user_id:", trimmedUserId);
      return { success: false, error: 'INVALID_CREDENTIALS' };
    }
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userProfile.email,
      password: password.trim(),
    });

    if (signInError) {
      console.error("AUTHENTICATION FAILED:", signInError.message);
      if (signInError.message.includes("Invalid login credentials")) {
         return { success: false, error: 'INVALID_CREDENTIALS' };
      }
      return { success: false, error: 'UNKNOWN_ERROR' };
    }

    // If signIn is successful, the onAuthStateChange listener will fire and handle fetching the profile.
    return { success: true, error: null };
  };

  const logout = async () => {
    // Calling signOut will trigger the onAuthStateChange listener, which will clear the user state.
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