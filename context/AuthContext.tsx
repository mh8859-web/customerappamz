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

const fetchAndMapProfile = async (
  supabaseUser: SupabaseUser
): Promise<User | null> => {
  try {
    // Standard profile lookup
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();
    
    if (error || !data) {
        console.warn("AuthContext: Profile record not found in public.users yet.");
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
  } catch (err) {
    console.error("Profile retrieval failed:", err);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);

  const syncAuth = useCallback(async (session: any, mounted: boolean) => {
    if (!session?.user) {
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
      return;
    }

    const profile = await fetchAndMapProfile(session.user);
    
    if (mounted) {
      if (profile) {
        setUser(profile);
      } else {
        // CRITICAL FIX: If profile fetch fails but session exists, 
        // DO NOT overwrite with a "Customer" skeleton. 
        // Check if we already have a user in state. If so, don't change it.
        // This prevents the "Role Flip" bug during navigation.
        setUser((currentUser) => {
            if (currentUser && currentUser.id === session.user.id) {
                return currentUser; // Keep existing validated role
            }
            return null; // Only clear if it's a completely new or broken session
        });
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await syncAuth(session, mounted);
      } catch (e) {
        console.error("Auth Initialization Error:", e);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            setUser(null);
            setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await syncAuth(session, mounted);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [syncAuth]);


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
      
      if (signInError) return { success: false, error: "INVALID_CREDENTIALS" };
      return { success: true, error: null };
    } catch (e) {
      return { success: false, error: "UNKNOWN_ERROR" };
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
        setUser(null);
        setImpersonatedUser(null);
        await supabase.auth.signOut();
    } finally {
        setLoading(false);
        window.location.href = '/#/login';
    }
  }, []);
  
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