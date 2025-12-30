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

// Instant mapping helper
const createShellUser = (sessionUser: any): User => ({
    id: sessionUser.id,
    fullName: sessionUser.user_metadata?.full_name || "Authorized User",
    email: sessionUser.email || "",
    role: (sessionUser.user_metadata?.role as any) || "Customer",
    avatarUrl: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
    verified: true,
    verificationRequested: false,
    userId: sessionUser.user_metadata?.user_id || "",
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
        const fullUser = {
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          role: data.role,
          avatarUrl: data.avatar_url || 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
          verified: !!data.verified,
          verificationRequested: !!data.verification_requested,
          userId: data.user_id,
        };
        setUser(fullUser);
        localStorage.setItem(`user_profile_${data.id}`, JSON.stringify(fullUser));
      }
    } catch (err) {
      console.error("Auth: Background sync failed", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // 1. Instant check for session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Use cache or shell to let user in IMMEDIATELY
        const cached = localStorage.getItem(`user_profile_${session.user.id}`);
        setUser(cached ? JSON.parse(cached) : createShellUser(session.user));
        
        // Refresh profile in background without blocking
        fetchProfile(session.user.id);
      }
      
      if (mounted) setLoading(false);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const shell = createShellUser(session.user);
            setUser(shell);
            fetchProfile(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);


  const login = useCallback(async (
    userId: string,
    password: string
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      setLoading(true);
      const trimmedUserId = userId.trim().toLowerCase();
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