"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

import { Alert, Button, Field, Input, PageHeader, Select } from "@/components/ui";
import { ApiError, apiBase, fieldErrors, getAccessToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Business } from "@/lib/types";

const PRESET_COLORS = [
  { label: "Indigo",   primary: "#1e293b", accent: "#6366f1" },  // default
  { label: "Violet",   primary: "#1e1b4b", accent: "#8b5cf6" },
  { label: "Sky",      primary: "#0c1a2e", accent: "#0ea5e9" },
  { label: "Emerald",  primary: "#052e16", accent: "#10b981" },
  { label: "Rose",     primary: "#1c0a0f", accent: "#f43f5e" },
  { label: "Amber",    primary: "#1c1814", accent: "#d4892a" },  // legacy copper
  { label: "Slate",    primary: "#0f172a", accent: "#64748b" },
  { label: "Charcoal", primary: "#18181b", accent: "#a78bfa" },
];

const empty: Partial<Business> = {
  name: "",
  legal_name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  state: "",
  country: "Pakistan",
  postal_code: "",
  tax_number: "",
  primary_color: "#1e293b",
  accent_color: "#6366f1",
  timezone: "Asia/Karachi",
  date_format: "DD/MM/YYYY",
  fiscal_year_start_month: 7,
  business_type: "general",
};

export default function BusinessPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState<Partial<Business>>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${apiBase()}/api/business/`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    })
      .then((r) => r.json())
      .then((data: Business) => {
        setForm(data);
        if (data.logo) setLogoPreview(data.logo);
      });
  }, []);

  function set<K extends keyof Business>(key: K, value: Business[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    setErrors({});
    try {
      const body = new FormData();
      const fields: (keyof Business)[] = [
        "name", "legal_name", "email", "phone", "website", "address",
        "city", "state", "country", "postal_code", "tax_number",
        "primary_color", "accent_color", "timezone", "date_format",
        "fiscal_year_start_month", "business_type",
      ];
      for (const key of fields) {
        const val = form[key];
        if (val !== undefined && val !== null) body.append(key, String(val));
      }
      if (logoFile) body.append("logo", logoFile);

      const res = await fetch(`${apiBase()}/api/business/`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getAccessToken()}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(res.status, data);
      setForm(data);
      if (data.logo) setLogoPreview(data.logo);
      setLogoFile(null);
      setSaved(true);
      // refresh auth context so sidebar updates immediately
      await refreshUser();
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
      else setErrors({ detail: "Could not save. Try again." });
    } finally {
      setPending(false);
    }
  }

  const initials = (form.name || "B")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="Settings"
        title="Business profile"
        description="Name, logo, colors and contact details."
      />

      <form onSubmit={onSubmit} className="space-y-6">
        {errors.detail && (
          <Alert>{errors.detail}</Alert>
        )}

        {/* ── Logo + Colors ── */}
        <div className="card p-6">
          <h2 className="mb-5 font-medium text-surface-900">Brand</h2>

          {/* Logo */}
          <div className="mb-6 flex items-center gap-5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50 transition hover:border-brand-400"
            >
              {logoPreview ? (
                <Image
                  src={logoPreview}
                  alt="Business logo"
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-xl font-bold text-white"
                  style={{ background: form.accent_color || "#d4892a" }}
                >
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                <span className="text-xs font-medium text-white">Change</span>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onLogoChange}
            />
            <div>
              <p className="text-sm font-medium text-surface-900">Business logo</p>
              <p className="mt-0.5 text-xs text-surface-400">
                PNG or JPG. Shows in sidebar and on receipts.
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-500"
              >
                {logoPreview ? "Replace logo" : "Upload logo"}
              </button>
            </div>
          </div>

          {/* Color presets */}
          <div className="mb-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-surface-400">
              Theme preset
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
              {PRESET_COLORS.map((preset) => {
                const active =
                  form.primary_color === preset.primary &&
                  form.accent_color === preset.accent;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    title={preset.label}
                    onClick={() => {
                      set("primary_color", preset.primary);
                      set("accent_color", preset.accent);
                    }}
                    className="group flex flex-col items-center gap-1.5"
                  >
                    {/* Color swatch — split diagonal */}
                    <div
                      className={`relative h-10 w-10 overflow-hidden rounded-xl border-2 transition ${
                        active ? "border-surface-900 scale-110" : "border-transparent hover:border-surface-200"
                      }`}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ background: preset.primary }}
                      />
                      <div
                        className="absolute bottom-0 right-0 h-5 w-5"
                        style={{
                          background: preset.accent,
                          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-surface-400 group-hover:text-surface-500">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom color pickers */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sidebar color">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primary_color || "#1c1814"}
                  onChange={(e) => set("primary_color", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-surface-200 p-1"
                />
                <code className="text-sm text-surface-400">
                  {form.primary_color || "#1c1814"}
                </code>
              </div>
            </Field>
            <Field label="Accent color">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.accent_color || "#d4892a"}
                  onChange={(e) => set("accent_color", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-surface-200 p-1"
                />
                <code className="text-sm text-surface-400">
                  {form.accent_color || "#d4892a"}
                </code>
              </div>
            </Field>
          </div>

          {/* Live preview strip */}
          <div
            className="mt-4 flex items-center gap-3 rounded-xl p-3"
            style={{ background: form.primary_color || "#1c1814" }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: form.accent_color || "#d4892a" }}
            >
              {initials}
            </div>
            <span className="text-sm font-medium text-white/80">
              {form.name || "Your business"}
            </span>
            <div
              className="ml-auto rounded-lg px-3 py-1 text-xs font-medium"
              style={{
                background: form.accent_color || "#d4892a",
                color: form.primary_color || "#1c1814",
              }}
            >
              Active
            </div>
          </div>
        </div>

        {/* ── Business info ── */}
        <div className="card grid gap-4 p-6 md:grid-cols-2">
          <h2 className="font-medium text-surface-900 md:col-span-2">Business info</h2>

          <Field label="Business name" error={errors.name}>
            <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} required />
          </Field>
          <Field label="Legal name">
            <Input value={form.legal_name || ""} onChange={(e) => set("legal_name", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="Website">
            <Input value={form.website || ""} onChange={(e) => set("website", e.target.value)} />
          </Field>
          <Field label="NTN number">
            <Input value={form.tax_number || ""} onChange={(e) => set("tax_number", e.target.value)} />
          </Field>
          <Field label="Address">
            <Input value={form.address || ""} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.city || ""} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={form.state || ""} onChange={(e) => set("state", e.target.value)} />
          </Field>
          <Field label="Country">
            <Input value={form.country || ""} onChange={(e) => set("country", e.target.value)} />
          </Field>
          <Field label="Business type">
            <Select value={form.business_type || "general"} onChange={(e) => set("business_type", e.target.value)}>
              <option value="general">General retail</option>
              <option value="grocery">Grocery</option>
              <option value="clothing">Clothing</option>
              <option value="restaurant">Restaurant</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="electronics">Electronics</option>
              <option value="pizza">Pizza shop</option>
            </Select>
          </Field>
          <Field label="Timezone">
            <Input value={form.timezone || ""} onChange={(e) => set("timezone", e.target.value)} />
          </Field>
          <Field label="Date format">
            <Select value={form.date_format || "DD/MM/YYYY"} onChange={(e) => set("date_format", e.target.value)}>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </Select>
          </Field>
          <Field label="Fiscal year start month">
            <Input
              type="number"
              min={1}
              max={12}
              value={form.fiscal_year_start_month || 7}
              onChange={(e) => set("fiscal_year_start_month", Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {saved && <span className="text-sm text-emerald-700">Saved — sidebar updated</span>}
        </div>
      </form>
    </div>
  );
}
