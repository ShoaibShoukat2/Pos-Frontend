"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { Building2, Monitor, Shield } from "lucide-react";

import { Alert, Button, Field, Input } from "@/components/ui";
import { ApiError, fieldErrors } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type RoleId = "owner" | "cashier" | "platform";

const ROLES: {
  id: RoleId;
  portal: "tenant" | "cashier" | "platform";
  title: string;
  sub: string;
  icon: typeof Building2;
}[] = [
  { id: "owner",    portal: "tenant",   title: "Owner",   sub: "Dashboard & reports", icon: Building2 },
  { id: "cashier",  portal: "cashier",  title: "Cashier", sub: "POS counter only",    icon: Monitor   },
  { id: "platform", portal: "platform", title: "Admin",   sub: "Platform access",     icon: Shield    },
];

function loginMessage(body: unknown) {
  const f = fieldErrors(body);
  return f.detail || f.email || f.password || f.non_field_errors || "Incorrect email or password.";
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const preset = search.get("role");
  const initial = ROLES.some((r) => r.id === preset) ? (preset as RoleId) : "owner";
  const [role, setRole]       = useState<RoleId>(initial);
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [error, setError]     = useState("");
  const [pending, setPending] = useState(false);
  const selected = useMemo(() => ROLES.find((r) => r.id === role)!, [role]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await login(email, password, selected.portal);
    } catch (err) {
      if (err instanceof ApiError) setError(loginMessage(err.body));
      else setError("Could not connect. Check your internet and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-50 px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Brand mark */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/25">
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.2" fill="white" />
              <rect x="8" y="1" width="5" height="5" rx="1.2" fill="white" opacity="0.7" />
              <rect x="1" y="8" width="5" height="5" rx="1.2" fill="white" opacity="0.7" />
              <rect x="8" y="8" width="5" height="5" rx="1.2" fill="white" opacity="0.35" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-surface-900">Universal POS</h1>
          <p className="mt-1 text-sm text-surface-400">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-card">

          {/* Role tabs */}
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-surface-100 p-1">
            {ROLES.map((item) => {
              const active = role === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setRole(item.id);
                    setError("");
                    router.replace(`/login?role=${item.id}`, { scroll: false });
                  }}
                  className={`flex flex-col items-center gap-1 rounded-lg py-2.5 text-center text-[11px] font-medium transition-all ${
                    active
                      ? "bg-white text-brand-600 shadow-sm"
                      : "text-surface-400 hover:text-surface-700"
                  }`}
                >
                  <Icon size={14} />
                  {item.title}
                </button>
              );
            })}
          </div>
          <p className="mb-4 text-xs text-surface-400">{selected.sub}</p>

          <form onSubmit={onSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••••"
              />
            </Field>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-700 disabled:opacity-50"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-surface-400">
          No account?{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Create a business
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-surface-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
