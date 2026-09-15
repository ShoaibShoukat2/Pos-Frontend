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
  hint: string;
  button: string;
  icon: typeof Building2;
}[] = [
  {
    id: "owner",
    portal: "tenant",
    title: "Business owner",
    hint: "Full shop dashboard, products, reports and staff.",
    button: "Enter workspace",
    icon: Building2,
  },
  {
    id: "cashier",
    portal: "cashier",
    title: "Cashier",
    hint: "POS, customers and cash drawer only.",
    button: "Open my desk",
    icon: Monitor,
  },
  {
    id: "platform",
    portal: "platform",
    title: "Platform admin",
    hint: "Software owner. All businesses and users.",
    button: "Open platform",
    icon: Shield,
  },
];

function loginMessage(body: unknown) {
  const fields = fieldErrors(body);
  return fields.detail || fields.email || fields.password || fields.non_field_errors || "Could not sign in.";
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
      else setError("Could not reach the server. Is Django running on :8000?");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-8 sm:py-10">
      <div className="w-full max-w-lg">
        <Link href="/" className="font-display text-3xl text-ink-950">
          Universal POS
        </Link>
        <div className="card mt-6 p-6">
          <h1 className="font-display text-2xl">Sign in</h1>
          <p className="mt-1 text-sm text-ink-700/70">First choose who you are, then enter your email and password.</p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {ROLES.map((item) => {
              const Icon = item.icon;
              const active = role === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setRole(item.id);
                    setError("");
                    router.replace(`/login?role=${item.id}`, { scroll: false });
                  }}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    active ? "border-copper-500 bg-copper-50 ring-2 ring-copper-500/20" : "border-paper-200 bg-white hover:border-copper-300"
                  }`}
                >
                  <Icon size={18} className={active ? "text-copper-600" : "text-ink-700/50"} />
                  <p className="mt-2 text-sm font-medium text-ink-950">{item.title}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ink-700/60">{selected.hint}</p>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {error ? <Alert>{error}</Alert> : null}
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Signing in…" : selected.button}
            </Button>
          </form>
        </div>
        <p className="mt-4 text-sm text-ink-700/70">
          New shop?{" "}
          <Link href="/register" className="text-copper-600 underline">
            Create a business
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center text-sm text-ink-700/70">Loading sign in…</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
