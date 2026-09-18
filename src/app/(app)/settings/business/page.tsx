"use client";

import { FormEvent, useEffect, useState } from "react";

import { Alert, Button, Field, Input, PageHeader, Select } from "@/components/ui";
import { ApiError, api, fieldErrors } from "@/lib/api";
import type { Business } from "@/lib/types";

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
  timezone: "Asia/Karachi",
  date_format: "DD/MM/YYYY",
  fiscal_year_start_month: 7,
  business_type: "general",
};

export default function BusinessPage() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api<Business>("/api/business/").then(setForm);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setSaved(false);
    setErrors({});
    try {
      const updated = await api<Business>("/api/business/", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setForm(updated);
      setSaved(true);
    } catch (err) {
      if (err instanceof ApiError) setErrors(fieldErrors(err.body));
    } finally {
      setPending(false);
    }
  }

  function set<K extends keyof Business>(key: K, value: Business[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <PageHeader
        eyebrow="Module 1"
        title="Business profile"
        description="Shop name, contact details, timezone and the business type used for catalog defaults."
      />
      <form onSubmit={onSubmit} className="card grid gap-4 p-6 md:grid-cols-2">
        {errors.detail ? (
          <div className="md:col-span-2">
            <Alert>{errors.detail}</Alert>
          </div>
        ) : null}
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
        <Field label="Address" error={errors.address}>
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
        <Field label="Postal code">
          <Input value={form.postal_code || ""} onChange={(e) => set("postal_code", e.target.value)} />
        </Field>
        <Field label="Business type">
          <Select value={form.business_type || "general"} onChange={(e) => set("business_type", e.target.value)}>
            <option value="general">General retail</option>
            <option value="grocery">Grocery</option>
            <option value="clothing">Clothing</option>
            <option value="restaurant">Restaurant</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="electronics">Electronics</option>
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
        <div className="flex items-center gap-3 md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
          {saved ? <span className="text-sm text-emerald-700">Saved</span> : null}
        </div>
      </form>
    </div>
  );
}
