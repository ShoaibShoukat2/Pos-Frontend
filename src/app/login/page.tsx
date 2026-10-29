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
  button: string;
  icon: typeof Building2;
}[] = [
  {
    id: "owner",
    portal: "tenant",
    title: "Owner",
    sub: "Dashboard, reports, staff",
    button: "Sign in",
    icon: Building2,
  },
  {
    id: "cashier",
    portal: "cashier",
    title: "Cashier",
    sub: "POS counter only",
    button: "Sign in",
    icon: Monitor,
  },
  {
    id: "platform",
    portal: "platform",
    title: "Admin",
    sub: "Platform management",
    button: "Sign in",
    icon: Shield,
  },
];

function loginMessage(body: unknown) {
  const fields = fieldErrors(body);
  return (
    fields.detail ||
    fields.email ||
    fields.password ||
    fields.non_field_errors ||
    "Incorrect email or password."
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const preset = search.get("role");
  const initial = ROLES.some((r) => r.id === preset) ? (preset as RoleId) : "owner";
  const [role, setRole] = useState<RoleId>(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const selected = useMemo(() => ROLES.find((r) => r.id === role) || ROLES[0], [role]);

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
    <div className="grid min-h-dvh place-items-center bg-paper-50 px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 mb-4">
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#d4892a" />
              <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.6" />
              <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.6" />
              <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.3" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-ink-950">Universal POS</h1>
          <p className="mt-1 text-sm text-ink-700/60">Sign in to your workspace</p>
        </div>

        <div className="card p-6">
          {/* Role selector */}
          <div className="mb-5 grid grid-cols-3 gap-1.5 rounded-xl bg-paper-100 p-1">
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
                  className={`flex flex-col items-center gap-1 rounded-lg py-2.5 text-center transition ${
                    active
                      ? "bg-white shadow-sm text-ink-950"
                      : "text-ink-700/50 hover:text-ink-700"
                  }`}
                >
                  <Icon size={15} />
                  <span className="text-[11px] font-medium">{item.title}</span>
                </button>
              );
            })}
          </div>

          <p className="mb-4 text-xs text-ink-700/50">{selected.sub}</p>

          <form onSubmit={onSubmit} className="space-y-4">
            {error ? <Alert>{error}</Alert> : null}
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Signing in…" : selected.button}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-ink-700/55">
          No account?{" "}
          <Link href="/register" className="text-copper-600 hover:text-copper-500 font-medium">
            Create a business
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-ink-700/60">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
