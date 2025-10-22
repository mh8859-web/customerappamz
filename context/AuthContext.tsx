import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "../services/supabaseClient";
import { User } from "../types";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    userId: string,
    password: string
  ) => Promise<{ success: boolean; error: string | null }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  isImpersonating: boolean;
  startImpersonation: (targetUser: User) => void;
  stopImpersonation: () => void;
  impersonatedUser: User | null;
  following: Set<string>;
  toggleFollow: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchAndMapProfile = async (
  supabaseUser: SupabaseUser
): Promise<User | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", supabaseUser.id)
    .single();

  if (error || !data) {
    console.error("Failed to fetch user profile:", error?.message);
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name || "User",
    email: data.email,
    role: data.role,
    avatarUrl: data.avatar_url || 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
    verified: !!data.verified,
    verificationRequested: !!data.verification_requested,
    userId: data.user_id || '',
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  // --- RE-ARCHITECTED AUTH FLOW (THE DEFINITIVE FIX) ---
  // This useEffect relies on onAuthStateChange as the single source of truth.
  // It fires immediately upon subscription with the initial session state,
  // which eliminates race conditions. A try/finally block guarantees that
  // the loading state is resolved, preventing the app from getting stuck.
  useEffect(() => {
    setLoading(true);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session) {
            const profile = await fetchAndMapProfile(session.user);
            setUser(profile);
          } else {
            setUser(null);
          }
        } catch (error) {
            console.error("Error during auth state change processing:", error);
            setUser(null); // Ensure user is logged out on error
        } finally {
            // This guarantees the app doesn't get stuck on the loading shell
            setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);


  const login = useCallback(async (
    userId: string,
    password: string
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const trimmedUserId = userId.trim().toLowerCase();
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("email")
        .eq("user_id", trimmedUserId)
        .single();

      if (profileError || !profile?.email) {
        return { success: false, error: "INVALID_CREDENTIALS" };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password.trim(),
      });
      
      if (signInError) {
        return { success: false, error: "INVALID_CREDENTIALS" };
      }
      
      // The onAuthStateChange listener will handle setting the user state.
      return { success: true, error: null };

    } catch (e) {
      console.error("Login error:", e);
      return { success: false, error: "UNKNOWN_ERROR" };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('impersonation_admin');
    setImpersonatedUser(null);
    setUser(null);
  }, []);
  
  const toggleFollow = useCallback((userId: string) => {
    setFollowing(prevFollowing => {
        const newFollowing = new Set(prevFollowing);
        if (newFollowing.has(userId)) {
            newFollowing.delete(userId);
        } else {
            newFollowing.add(userId);
        }
        return newFollowing;
    });
  }, []);

  const startImpersonation = useCallback((targetUser: User) => {
    if (user && user.role === 'Admin') {
      sessionStorage.setItem('impersonation_admin', JSON.stringify(user));
      setImpersonatedUser(targetUser);
      setUser(targetUser);
    }
  }, [user]);

  const stopImpersonation = useCallback(() => {
    const adminUserJson = sessionStorage.getItem('impersonation_admin');
    if (adminUserJson) {
      const adminUser = JSON.parse(adminUserJson);
      setUser(adminUser);
      setImpersonatedUser(null);
      sessionStorage.removeItem('impersonation_admin');
    }
  }, []);
  
  useEffect(() => {
    let inactivityTimer: number;
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      if (user && !impersonatedUser) {
        inactivityTimer = window.setTimeout(() => {
          logout();
        }, 10 * 60 * 1000);
      }
    };
    const activityEvents: (keyof WindowEventMap)[] = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    if (user) {
      activityEvents.forEach(event => window.addEventListener(event, resetInactivityTimer));
      resetInactivityTimer();
    }
    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [user, logout, impersonatedUser]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const value = { 
    user, 
    loading, 
    login, 
    logout, 
    updateUser, 
    isImpersonating: !!impersonatedUser,
    startImpersonation,
    stopImpersonation,
    impersonatedUser,
    following,
    toggleFollow,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};