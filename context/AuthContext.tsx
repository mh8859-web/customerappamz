import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "../services/supabaseClient.ts";
import { User } from "../types.ts";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    identifier: string,
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
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", supabaseUser.id)
      .single();

    if (error || !data) {
      return {
        id: supabaseUser.id,
        fullName: supabaseUser.user_metadata?.full_name || "User",
        email: supabaseUser.email || "",
        role: (supabaseUser.user_metadata?.role as any) || "Customer",
        avatarUrl: 'https://res.cloudinary.com/dzvmyhpff/image/upload/v1759808706/highqualiamaz_etnjtt.webp',
        verified: !!supabaseUser.user_metadata?.verified,
        verificationRequested: false,
        userId: supabaseUser.user_metadata?.user_id || "",
      };
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
  } catch (e) {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('impersonation_admin');
    setImpersonatedUser(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const profile = await fetchAndMapProfile(session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    return () => authListener.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      const trimmedId = identifier.trim();
      const isEmailInput = trimmedId.includes('@');
      let targetEmail = trimmedId;

      if (!isEmailInput) {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("email")
          .ilike("user_id", trimmedId)
          .single();

        if (profileError || !profile?.email) return { success: false, error: "USER_NOT_FOUND" };
        targetEmail = profile.email;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail.trim().toLowerCase(),
        password,
      });
      
      return signInError ? { success: false, error: "INVALID_CREDENTIALS" } : { success: true, error: null };
    } catch (e) {
      return { success: false, error: "UNKNOWN_ERROR" };
    }
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
      setUser(JSON.parse(adminUserJson));
      setImpersonatedUser(null);
      sessionStorage.removeItem('impersonation_admin');
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const value = { user, loading, login, logout, updateUser, isImpersonating: !!impersonatedUser, startImpersonation, stopImpersonation, impersonatedUser };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};