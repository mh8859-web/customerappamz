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
  
  // This useEffect hook is the core of the authentication logic.
  // It sets up a listener that reacts to any change in the user's authentication state.
  useEffect(() => {
    // onAuthStateChange fires an event upon initialization (if a session exists)
    // and whenever the user signs in or out. This is our single source of truth.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // If a session object exists, the user is authenticated.
        if (session) {
          // Fetch the detailed user profile from our public 'users' table.
          await fetchUserProfile(session.user);
        } else {
          // If no session exists, the user is not authenticated.
          setUser(null);
        }
        // Once the session check is complete (either we found a user or not),
        // we set loading to false. This unblocks the UI.
        setLoading(false);
      }
    );

    // The cleanup function unsubscribes from the listener when the component unmounts.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // The empty dependency array ensures this effect runs only once on component mount.

  const login = async (userId: string, password: string): Promise<{ success: boolean; error: string | null }> => {
    // By standardizing the email format, we can attempt to sign in directly
    // without a preliminary lookup. This is more efficient and secure.
    const proxyEmail = `user-${userId}@amaz-interiors.app`;

    const { error } = await supabase.auth.signInWithPassword({
      email: proxyEmail,
      password: password,
    });

    if (error) {
      // Supabase returns "Invalid login credentials" for both non-existent users
      // and incorrect passwords, which is good security practice. We log the
      // specific error for debugging but show a generic message to the user.
      console.error("AUTHENTICATION FAILED:", error.message);
      if (error.message.includes("Invalid login credentials")) {
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
