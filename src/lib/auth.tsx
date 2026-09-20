"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { NetworkError, api, clearTokens, saveTokens } from "./api";
import type { AuthPayload, User } from "./types";

const USER_KEY = "upos_user";

export function isCashier(user: User | null | undefined) {
  if (!user || user.is_owner || user.is_platform_admin) return false;
  if (user.is_cashier) return true;
  if ((user.role_name || "").toLowerCase() === "cashier") return true;
  return user.permissions.includes("pos.access") && !user.permissions.includes("report.sales");
}

export function homeFor(user: User) {
  if (user.is_platform_admin) return "/platform";
  if (isCashier(user)) return "/cashier";
  return "/dashboard";
}

function cashierAllowed(pathname: string) {
  return (
    pathname === "/cashier" ||
    pathname.startsWith("/cashier/") ||
    pathname === "/pos" ||
    pathname === "/cash" ||
    pathname.startsWith("/customers")
  );
}

function cacheUser(user: User | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, portal?: "tenant" | "platform" | "cashier") => Promise<void>;
  register: (payload: Record<string, string>) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  can: (code: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  async function refreshUser() {
    const me = await api<User>("/api/auth/me/");
    setUser(me);
    cacheUser(me);
  }

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("upos_access") : null;
    const cached = typeof window !== "undefined" ? localStorage.getItem(USER_KEY) : null;
    if (cached) {
      try {
        setUser(JSON.parse(cached));
        setLoading(false);
      } catch {
        /* ignore */
      }
    }
    if (!token) {
      setLoading(false);
      return;
    }
    refreshUser()
      .catch((err) => {
        if (err instanceof NetworkError) return;
        clearTokens();
        cacheUser(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const publicRoutes = ["/", "/login", "/register", "/platform/login", "/cashier/login"];
    const isPublic = publicRoutes.includes(pathname) || pathname.startsWith("/scan");
    const isPlatformRoute = pathname === "/platform" || pathname.startsWith("/platform/");
    const isCashierLogin = pathname === "/cashier/login";
    if (!user && !isPublic) {
      router.replace(isPlatformRoute ? "/platform/login" : pathname.startsWith("/cashier") ? "/cashier/login" : "/login");
      return;
    }
    if (!user) return;
    if (user.is_platform_admin) {
      if (pathname === "/login" || pathname === "/register" || pathname === "/platform/login" || isCashierLogin) {
        router.replace("/platform");
      } else if (!isPlatformRoute && pathname !== "/") {
        router.replace("/platform");
      }
      return;
    }
    if (isCashier(user)) {
      if (pathname === "/login" || pathname === "/register" || pathname === "/platform/login" || isCashierLogin) {
        router.replace("/cashier");
      } else if (isPlatformRoute || !cashierAllowed(pathname)) {
        router.replace("/cashier");
      }
      return;
    }
    if (pathname === "/login" || pathname === "/register" || pathname === "/platform/login" || isCashierLogin) {
      router.replace(homeFor(user));
    } else if (isPlatformRoute || pathname === "/cashier" || pathname.startsWith("/cashier/")) {
      router.replace(homeFor(user));
    }
  }, [loading, user, pathname, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password, portal = "tenant") {
        const path =
          portal === "platform"
            ? "/api/auth/platform/login/"
            : portal === "cashier"
              ? "/api/auth/cashier/login/"
              : "/api/auth/owner/login/";
        const data = await api<AuthPayload>(path, {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        saveTokens(data);
        setUser(data.user);
        cacheUser(data.user);
        router.push(homeFor(data.user));
      },
      async register(payload) {
        const data = await api<AuthPayload>("/api/auth/register/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        saveTokens(data);
        setUser(data.user);
        cacheUser(data.user);
        router.push("/dashboard");
      },
      logout() {
        const dest = user?.is_platform_admin ? "/platform/login" : isCashier(user) ? "/cashier/login" : "/login";
        clearTokens();
        cacheUser(null);
        setUser(null);
        router.push(dest);
      },
      refreshUser,
      can(code) {
        if (!user) return false;
        if (user.is_owner) return true;
        return user.permissions.includes(code);
      },
    }),
    [user, loading, router],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
