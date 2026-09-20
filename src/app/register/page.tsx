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
      if (err instanceof ApiError) {
        setErrors(fieldErrors(err.body));
      } else {
        setErrors({ detail: "Could not reach the server. Is Django running on :8000?" });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="font-display text-3xl text-ink-950">
          Universal POS
        </Link>
        <div className="card mt-6 p-6">
          <h1 className="font-display text-2xl">Create your business</h1>
          <p className="mt-1 text-sm text-ink-700/70">
            This creates the owner account, PKR and GST 18%.
          </p>
          <form onSubmit={onSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
            {errors.detail ? (
              <div className="sm:col-span-2">
                <Alert>{errors.detail}</Alert>
              </div>
            ) : null}
            <Field label="Business name" error={errors.business_name}>
              <Input value={form.business_name} onChange={(e) => set("business_name", e.target.value)} required />
            </Field>
            <Field label="Business type">
              <Select value={form.business_type} onChange={(e) => set("business_type", e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="First name" error={errors.first_name}>
              <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required />
            </Field>
            <Field label="Last name">
              <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
            </Field>
            <Field label="Password" error={errors.password}>
              <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={8} />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Creating…" : "Create workspace"}
              </Button>
            </div>
          </form>
        </div>
        <p className="mt-4 text-sm text-ink-700/70">
          Already set up?{" "}
          <Link href="/login" className="text-copper-600 underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
