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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely map database row to User object
const mapProfileData = (data: any): User => ({
  id: data.id,
  fullName: data.full_name || "User",
  email: data.email,
  role: data.role || "Customer", // Default role only for initialization
  avatarUrl: data.avatar_url || 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
  verified: !!data.verified,
  verificationRequested: !!data.verification_requested,
  userId: data.user_id || '',
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);

  const fetchProfile = useCallback(async (supabaseUserId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", supabaseUserId)
        .single();
      
      if (data && !error) {
        setUser(mapProfileData(data));
      }
    } catch (err) {
      console.error("AuthContext: Profile fetch failed", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // 1. Get current session immediately
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Try to load cached profile if possible to avoid flicker
        const cachedUser = localStorage.getItem(`user_profile_${session.user.id}`);
        if (cachedUser && mounted) {
           setUser(JSON.parse(cachedUser));
        }
        
        // Always fetch fresh data in background
        await fetchProfile(session.user.id);
      }
      
      if (mounted) setLoading(false);
    };

    initAuth();

    // 2. Listen for auth changes (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setUser(null);
          localStorage.removeItem('sb-lkpgsdtriqqotovaxytx-auth-token'); // Clear Supabase cache manually if needed
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Persist user to localStorage for instant boot on next refresh
  useEffect(() => {
    if (user) {
      localStorage.setItem(`user_profile_${user.id}`, JSON.stringify(user));
    }
  }, [user]);


  const login = useCallback(async (
    userId: string,
    password: string
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      setLoading(true);
      const trimmedUserId = userId.trim().toLowerCase();
      
      // Look up email by custom User ID
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("email")
        .eq("user_id", trimmedUserId)
        .single();

      if (profileError || !profile?.email) {
        setLoading(false);
        return { success: false, error: "INVALID_CREDENTIALS" };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: password.trim(),
      });
      
      if (signInError) {
          setLoading(false);
          return { success: false, error: "INVALID_CREDENTIALS" };
      }
      
      // user state will be updated by onAuthStateChange
      return { success: true, error: null };
    } catch (e) {
      setLoading(false);
      return { success: false, error: "UNKNOWN_ERROR" };
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
        if (user) localStorage.removeItem(`user_profile_${user.id}`);
        setUser(null);
        setImpersonatedUser(null);
        await supabase.auth.signOut();
    } finally {
        setLoading(false);
        window.location.hash = '#/login';
    }
  }, [user]);
  
  const startImpersonation = useCallback((targetUser: User) => {
    if (user && (user.role === 'Admin' || user.role === 'Sub-Admin')) {
      setImpersonatedUser(targetUser);
      setUser(targetUser);
    }
  }, [user]);

  const stopImpersonation = useCallback(() => {
    setImpersonatedUser(null);
    window.location.reload(); 
  }, []);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};