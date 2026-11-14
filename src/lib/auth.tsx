"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { NetworkError, api, clearTokens, saveTokens, setApiBase } from "./api";
import type { AuthPayload, User } from "./types";

const USER_KEY = "upos_user";

export function isCashier(user: User | null | undefined) {
  if (!user || user.is_owner || user.is_platform_admin) return false;
  if (user.is_cashier) return true;
  if ((user.role_name || "").toLowerCase() === "cashier") return true;
  return user.permissions.includes("pos.access") && !user.permissions.includes("report.sales");
}

export function isCarShowroom(user: User | null | undefined) {
  const type = (user?.business_type || "").toLowerCase().replace(/\s+/g, "_");
  return type === "car_showroom";
}

export function homeFor(user: User) {
  if (user.is_platform_admin) return "/platform";
  if (isCashier(user)) return "/cashier";
  if (isCarShowroom(user)) return "/showroom";
  return "/dashboard";
}

function goHome(user: User) {
  const dest = homeFor(user);
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path === dest || path.startsWith(`${dest}/`)) return;
  window.location.assign(dest);
}

async function withBusinessType(user: User): Promise<User> {
  if (user.is_platform_admin) return user;
  try {
    const biz = await api<{ business_type?: string; name?: string }>("/api/business/");
    if (!biz?.business_type && !biz?.name) return user;
    return {
      ...user,
      business_type: biz.business_type || user.business_type,
      business_name: user.business_name || biz.name,
    };
  } catch {
    return user;
  }
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

function applyBusinessTheme(user: User | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const primary = user?.business_primary_color || "#1e293b";
  const accent  = user?.business_accent_color  || "#6366f1";
  root.style.setProperty("--brand-primary", primary);
  root.style.setProperty("--brand-accent", accent);
  // derive hover shade (slightly lighter) for accent
  root.style.setProperty("--brand-accent-hover", accent + "dd");
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
    const me = await withBusinessType(await api<User>("/api/auth/me/"));
    setUser(me);
    cacheUser(me);
    applyBusinessTheme(me);
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const fromDesktop = await window.electronAPI?.getApiUrl?.();
        if (fromDesktop) setApiBase(fromDesktop);
      } catch {
        /* website build has no desktop bridge */
      }
      if (!alive) return;
      const token = localStorage.getItem("upos_access");
      const cached = localStorage.getItem(USER_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUser(parsed);
          applyBusinessTheme(parsed);
        } catch {
          /* ignore */
        }
      }
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        await refreshUser();
      } catch (err) {
        if (!(err instanceof NetworkError)) {
          clearTokens();
          cacheUser(null);
          setUser(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const publicRoutes = ["/", "/login", "/register", "/platform/login", "/cashier/login"];
    const isPublic = publicRoutes.includes(pathname) || pathname.startsWith("/scan") || pathname.startsWith("/check");
    const isPlatformRoute = pathname === "/platform" || pathname.startsWith("/platform/");
    const isShowroomRoute = pathname === "/showroom" || pathname.startsWith("/showroom/");
    const isCashierLogin = pathname === "/cashier/login";
    if (!user && !isPublic) {
      router.replace(isPlatformRoute ? "/platform/login" : pathname.startsWith("/cashier") ? "/cashier/login" : "/login");
      return;
    }
    if (!user) return;
    if (user.is_platform_admin) {
      if (pathname === "/login" || pathname === "/register" || pathname === "/platform/login" || isCashierLogin) {
        router.replace("/platform");
      } else if (!isPlatformRoute && pathname !== "/" && !isShowroomRoute) {
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
    // Car showroom accounts use the showroom shell. Retail routes render blank for them.
    if (isCarShowroom(user)) {
      const publicStay = pathname === "/" || pathname.startsWith("/scan") || pathname.startsWith("/check");
      if (!isShowroomRoute && !publicStay) goHome(user);
      return;
    }
    if (pathname === "/login" || pathname === "/register" || pathname === "/platform/login" || isCashierLogin) {
      goHome(user);
    } else if (isPlatformRoute || pathname === "/cashier" || pathname.startsWith("/cashier/") || (isCarShowroom(user) && pathname === "/dashboard")) {
      goHome(user);
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
        const next = await withBusinessType(data.user);
        setUser(next);
        cacheUser(next);
        applyBusinessTheme(next);
        goHome(next);
      },
      async register(payload) {
        const data = await api<AuthPayload>("/api/auth/register/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        saveTokens(data);
        const next = await withBusinessType({
          ...data.user,
          business_type: data.user.business_type || payload.business_type,
        });
        setUser(next);
        cacheUser(next);
        applyBusinessTheme(next);
        goHome(next);
      },
      logout() {
        const dest = user?.is_platform_admin ? "/platform/login" : isCashier(user) ? "/cashier/login" : "/login";
        clearTokens();
        cacheUser(null);
        applyBusinessTheme(null);
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
