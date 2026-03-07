import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface AuthState {
  isAuthenticated: boolean;
  role: "admin" | "user" | null;
  name: string | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (role: "admin" | "user", name: string, token: string) => void;
  logout: () => void;
  adminKey: string | null;
  setAdminKey: (key: string | null) => void;
}

const STORAGE_KEY = "epistemologia_auth";
const ADMIN_KEY_STORAGE = "epistemologia_admin_key";
const USER_KEY_STORAGE = "epistemologia_user_key";

const SUPABASE_URL = "https://juxdfkzaxhunvekjfybp.supabase.co";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return { isAuthenticated: false, role: null, name: null, token: null };
  });

  const [adminKey, setAdminKey] = useState<string | null>(() => {
    return localStorage.getItem(ADMIN_KEY_STORAGE);
  });

  useEffect(() => {
    if (auth.isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [auth]);

  useEffect(() => {
    if (adminKey) {
      localStorage.setItem(ADMIN_KEY_STORAGE, adminKey);
    } else {
      localStorage.removeItem(ADMIN_KEY_STORAGE);
    }
  }, [adminKey]);

  const logout = useCallback(() => {
    setAuth({ isAuthenticated: false, role: null, name: null, token: null });
    setAdminKey(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    localStorage.removeItem(USER_KEY_STORAGE);
  }, []);

  const validateSession = useCallback(async () => {
    if (!auth.isAuthenticated) return;

    if (auth.role === "admin" && adminKey) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/auth-login`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: adminKey }),
          }
        );
        if (!res.ok) {
          logout();
        }
      } catch {
        // Network error — don't logout
      }
      return;
    }

    const userKey = localStorage.getItem(USER_KEY_STORAGE);
    if (auth.role === "user" && userKey) {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/auth-validate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: userKey }),
          }
        );
        if (!res.ok) {
          logout();
        }
      } catch {
        // Network error — keep session
      }
    }
  }, [auth.isAuthenticated, auth.role, adminKey, logout]);

  useEffect(() => {
    validateSession();
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [validateSession]);

  const login = (role: "admin" | "user", name: string, token: string) => {
    setAuth({ isAuthenticated: true, role, name, token });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, adminKey, setAdminKey }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
