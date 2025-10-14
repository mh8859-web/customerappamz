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
      await supabase.auth.signOut();
      setUser(null);
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
    }
  };
  
  useEffect(() => {
    // This function actively checks for a session on initial load.
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
      }
      // Once the initial check is complete, we update the loading state.
      setLoading(false);
    };

    initializeAuth();

    // We then set up a listener for any subsequent auth state changes.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (userId: string, password: string): Promise<{ success: boolean; error: string | null }> => {
    // Step 1: Find the user's profile using their custom User ID to get their real email.
    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('email') // Select the actual email address
        .eq('user_id', userId)
        .single();
    
    if (profileError || !userProfile) {
        // This is the custom error condition for the Login page.
        console.error("AUTHENTICATION FAILED: Step 1 of 2. Could not find a user profile in the 'users' table with user_id = " + userId + ". Please ensure the user exists and the 'user_id' column is set correctly.");
        return { success: false, error: 'USER_NOT_FOUND' };
    }

    // Step 2: Use the fetched email to sign in with Supabase Auth.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userProfile.email, // Use the real email from the database
      password,
    });

    if (signInError) {
        console.error("AUTHENTICATION FAILED: Step 2 of 2. User profile found, but password was incorrect.", signInError);
        return { success: false, error: 'INVALID_PASSWORD' };
    }
    
    return { success: true, error: null };
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
