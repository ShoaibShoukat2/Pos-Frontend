"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { Notice } from "@/components/hostel/bits";
import { publicApi } from "@/lib/api";
import { errText } from "@/lib/hostel";

function InviteBody() {
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await publicApi<{ detail: string }>("/api/hostel/invite/", { method: "POST", body: JSON.stringify({ token: params.get("token") || "", password }) });
      setMessage(result.detail);
    } catch (err) {
      setError(errText(err));
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-royal-50 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-royal-100 bg-white p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-royal-700">Hostel staff</p>
        <h1 className="font-display text-3xl text-slate-900">Set your password</h1>
        <p className="text-sm text-slate-500">This link works once. After that, sign in with your email.</p>
        <Notice text={message} />
        <Notice tone="bad" text={error} />
        <input type="password" className="field w-full" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" required />
        <button className="btn btn-primary w-full" type="submit">Save password</button>
        <Link href="/login" className="block text-center text-sm font-semibold text-royal-800">Go to sign in</Link>
      </form>
    </main>
  );
}

export default function InvitePage() {
  return <Suspense fallback={<p className="p-6 text-sm text-slate-400">Loading invite…</p>}><InviteBody /></Suspense>;
}
