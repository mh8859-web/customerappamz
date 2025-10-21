
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
    await supabase.auth.signOut();
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

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) console.error("Session error:", error);

      if (session?.user) {
        const profile = await fetchAndMapProfile(session.user);
        setUser(profile);
      }
      setLoading(false);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          const profile = await fetchAndMapProfile(session.user);
          setUser(profile);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const login = async (
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

      const { data, error: signInError } = await supabase.auth.signInWithPassword(
        {
          email: profile.email,
          password: password.trim(),
        }
      );

      if (signInError || !data.user)
        return { success: false, error: "INVALID_CREDENTIALS" };

      return { success: true, error: null };
    } catch (e) {
      console.error("Login error:", e);
      return { success: false, error: "UNKNOWN_ERROR" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const value = { user, loading, login, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
