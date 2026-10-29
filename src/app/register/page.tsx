"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { Alert, Button, Field, Input, Select } from "@/components/ui";
import { ApiError, fieldErrors } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const TYPES = [
  { value: "general", label: "General retail" },
  { value: "grocery", label: "Grocery" },
  { value: "clothing", label: "Clothing" },
  { value: "restaurant", label: "Restaurant" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "electronics", label: "Electronics" },
  { value: "pizza", label: "Pizza shop" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    business_name: "",
    business_type: "general",
    city: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
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
    <div className="grid min-h-dvh place-items-center bg-paper-50 px-4 py-10">
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="mb-7 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-ink-950 mb-4">
            <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.2" fill="#d4892a" />
              <rect x="8" y="1" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.6" />
              <rect x="1" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.6" />
              <rect x="8" y="8" width="5" height="5" rx="1.2" fill="#d4892a" opacity="0.3" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-ink-950">Set up your business</h1>
          <p className="mt-1 text-sm text-ink-700/60">
            Takes 30 seconds. PKR currency and GST 18% are added automatically.
          </p>
        </div>

        <div className="card p-6">
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            {errors.detail ? (
              <div className="sm:col-span-2">
                <Alert>{errors.detail}</Alert>
              </div>
            ) : null}

            {/* Section: Business */}
            <div className="sm:col-span-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-700/40">Business</p>
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
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="City">
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Lahore"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="03xx-xxxxxxx"
              />
            </Field>

            {/* Section: Owner */}
            <div className="sm:col-span-2 mt-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-700/40">Owner account</p>
            </div>

            <Field label="First name" error={errors.first_name}>
              <Input
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                required
              />
            </Field>
            <Field label="Last name">
              <Input
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Password" error={errors.password}>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>

            <div className="sm:col-span-2 mt-2">
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Creating workspace…" : "Create workspace"}
              </Button>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-ink-700/55">
          Already have an account?{" "}
          <Link href="/login" className="text-copper-600 hover:text-copper-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
