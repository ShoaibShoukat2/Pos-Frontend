"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Field, Input, Select } from "@/components/ui";
import { ApiError, fieldErrors } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const TYPES = [
  { value: "general",     label: "General retail" },
  { value: "grocery",     label: "Grocery" },
  { value: "clothing",    label: "Clothing" },
  { value: "restaurant",  label: "Restaurant" },
  { value: "pharmacy",    label: "Pharmacy" },
  { value: "electronics", label: "Electronics" },
  { value: "pizza",       label: "Pizza shop" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    business_name: "", business_type: "general", city: "",
    first_name: "", last_name: "", email: "", phone: "", password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    setPending(true);
    try {
      await register(form);
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
      else setErrors({ detail: "Could not connect. Check your internet and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-50 px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Brand mark */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/25">
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.2" fill="white" />
              <rect x="8" y="1" width="5" height="5" rx="1.2" fill="white" opacity="0.7" />
              <rect x="1" y="8" width="5" height="5" rx="1.2" fill="white" opacity="0.7" />
              <rect x="8" y="8" width="5" height="5" rx="1.2" fill="white" opacity="0.35" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-surface-900">Set up your business</h1>
          <p className="mt-1 text-sm text-surface-400">
            Takes 30 seconds. PKR currency and GST 18% added automatically.
          </p>
        </div>

        <div className="rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-card">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">

            {errors.detail ? (
              <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errors.detail}
              </div>
            ) : null}

            {/* Business section */}
            <div className="sm:col-span-2 mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400">Business</p>
            </div>

            <Field label="Business name" error={errors.business_name}>
              <Input
                value={form.business_name}
                onChange={(e) => set("business_name", e.target.value)}
                placeholder="e.g. Al-Noor Traders"
                required
              />
            </Field>
            <Field label="Type">
              <Select value={form.business_type} onChange={(e) => set("business_type", e.target.value)}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Lahore" />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="03xx-xxxxxxx" />
            </Field>

            {/* Owner section */}
            <div className="sm:col-span-2 mt-2 mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-surface-400">Owner account</p>
            </div>

            <Field label="First name" error={errors.first_name}>
              <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required />
            </Field>
            <Field label="Last name">
              <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" required />
            </Field>
            <Field label="Password" error={errors.password}>
              <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} autoComplete="new-password" minLength={8} required />
            </Field>

            <div className="sm:col-span-2 mt-2">
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-700 disabled:opacity-50"
              >
                {pending ? "Creating workspace…" : "Create workspace"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-surface-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
