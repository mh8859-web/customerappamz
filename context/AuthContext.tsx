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

  // This re-architected useEffect hook ensures the app never gets stuck loading.
  useEffect(() => {
    // 1. Perform a one-time, guaranteed check for the initial session.
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await fetchAndMapProfile(session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error during initial session check:", error);
        setUser(null); // Ensure user is null on error
      } finally {
        // 2. GUARANTEE that loading stops, no matter what. This fixes the infinite load.
        setLoading(false);
      }
    };

    checkInitialSession();

    // 3. Listen for subsequent auth changes (e.g., login, logout in another tab).
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchAndMapProfile(session.user);
          setUser(profile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
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
      setLoading(true); // Show loader immediately
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

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(
        {
          email: profile.email,
          password: password.trim(),
        }
      );
      
      if (signInError || !signInData.user) {
        setLoading(false);
        return { success: false, error: "INVALID_CREDENTIALS" };
      }
      
      // Instead of waiting for the listener, we now take control for a deterministic flow.
      const userProfile = await fetchAndMapProfile(signInData.user);
      if (!userProfile) {
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return { success: false, error: "PROFILE_FETCH_FAILED" };
      }

      setUser(userProfile); // Manually set user state
      setLoading(false);    // Manually stop loading
      return { success: true, error: null };

    } catch (e) {
      setLoading(false);
      console.error("Login error:", e);
      return { success: false, error: "UNKNOWN_ERROR" };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);
  
  // --- Inactivity Logout Logic ---
  useEffect(() => {
    let inactivityTimer: number;

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      // If there's a user, set a new timer to log them out after 1 minute.
      if (user) {
        inactivityTimer = window.setTimeout(() => {
          // Timer expired, call the logout function.
          logout();
        }, 1 * 60 * 1000); // 1 minute
      }
    };

    // List of events that indicate user activity.
    const activityEvents: (keyof WindowEventMap)[] = [
      'mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'
    ];

    // If a user is logged in, start tracking their activity.
    if (user) {
      // Add event listeners that reset the timer on any activity.
      activityEvents.forEach(event => {
        window.addEventListener(event, resetInactivityTimer);
      });
      // Start the initial timer.
      resetInactivityTimer();
    }

    // Cleanup function: This runs when the component unmounts or when the user state changes.
    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [user, logout]); // Re-run this effect whenever the user logs in or out.

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