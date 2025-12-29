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
    // 3-second timeout for the database fetch to prevent UI hanging
    const fetchPromise = supabase
      .from("users")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 3000)
    );

    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
    const data = result.data;

    if (!data) return null;

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
    if (session?.user) {
      const profile = await fetchAndMapProfile(session.user);
      if (mounted) {
        setUser(profile);
        setLoading(false);
      }
    } else {
      if (mounted) {
        setUser(null);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. IMMEDIATE CHECK: Don't wait for events, check localStorage now.
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await syncAuth(session, mounted);
        } else {
          if (mounted) setLoading(false);
        }
      } catch (e) {
        if (mounted) setLoading(false);
      }
    };

    init();

    // 2. LISTENER: Handle subsequent login/logout events.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Only trigger heavy profile fetches on actual state changes
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
           await syncAuth(session, mounted);
        }
      }
    );

    // 3. SAFETY ESCAPE: Never let the app stay in "loading" for more than 4s
    const timer = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(timer);
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
      
      if (signInError) {
        return { success: false, error: "INVALID_CREDENTIALS" };
      }
      
      return { success: true, error: null };

    } catch (e) {
      return { success: false, error: "UNKNOWN_ERROR" };
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setImpersonatedUser(null);
    await supabase.auth.signOut();
    window.location.href = '/#/login';
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