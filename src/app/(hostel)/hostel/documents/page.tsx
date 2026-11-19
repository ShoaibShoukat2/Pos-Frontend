"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import { EmptyState, Notice, UploadField } from "@/components/hostel/bits";
import { api } from "@/lib/api";
import { errText, pageOf } from "@/lib/hostel";

function DocumentsBody() {
  const params = useSearchParams();
  const [rows, setRows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [file, setFile] = useState<{ data: string; name: string } | null>(null);
  const [form, setForm] = useState({ customer: params.get("customer") || "", title: "", kind: "other" });
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function load() {
    const query = new URLSearchParams({ page_size: "50" });
    if (form.customer) query.set("customer", form.customer);
    api(`/api/hostel/documents/?${query.toString()}`).then((data) => setRows(pageOf<any>(data).results)).catch((err) => setError(errText(err)));
  }
  useEffect(() => { load(); }, [form.customer]);
  useEffect(() => { api("/api/hostel/customers/?page_size=100").then((data) => setCustomers(pageOf<any>(data).results)).catch(() => undefined); }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) { setError("Choose a file."); return; }
    try {
      await api("/api/hostel/documents/", { method: "POST", body: JSON.stringify({ ...form, file_name: file.name, file_data: file.data }) });
      setMessage("Document saved in this account. It is not published as a public link.");
      setFile(null);
      load();
    } catch (err) {
      setError(errText(err));
    }
  }

  async function openDoc(id: string) {
    const doc = await api<{ file_data: string }>(`/api/hostel/documents/${id}/`);
    setPreview(doc.file_data);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-slate-900">Documents</h1>
      <p className="text-sm text-slate-500">CNIC, photos, and receipts stay behind login. Opening one loads it for this session only.</p>
      <Notice text={message} />
      <Notice tone="bad" text={error} />
      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-royal-100 bg-white p-4 shadow-card sm:grid-cols-2">
        <select className="field" value={form.customer} onChange={(event) => setForm({ ...form, customer: event.target.value })}><option value="">All customers</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</select>
        <input className="field" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        <select className="field" value={form.kind} onChange={(event) => setForm({ ...form, kind: event.target.value })}><option value="other">Other</option><option value="photo">Photo</option><option value="cnic_front">CNIC front</option><option value="cnic_back">CNIC back</option><option value="payment">Payment</option></select>
        <UploadField allowPdf label="File" onPick={(data, name) => setFile({ data, name })} />
        <button className="btn btn-primary" type="submit">Upload</button>
      </form>
      {rows.length === 0 ? <EmptyState title="No documents" text="Upload a CNIC, photo, or receipt." /> : (
        <div className="grid gap-2">
          {rows.map((row) => (
            <button key={row.id} className="flex items-center justify-between rounded-2xl border border-royal-100 bg-white px-4 py-3 text-left shadow-card" onClick={() => openDoc(row.id)}>
              <span><span className="font-medium">{row.title}</span><span className="block text-xs text-slate-400">{row.kind} · {row.file_name}</span></span>
              <span className="text-xs font-semibold text-royal-700">Open</span>
            </button>
          ))}
        </div>
      )}
      {preview ? (
        <div className="rounded-2xl border border-royal-100 bg-white p-4">
          {preview.startsWith("data:application/pdf") ? <iframe title="Document" src={preview} className="h-[70vh] w-full" /> : <img src={preview} alt="Uploaded document" className="max-h-[70vh] w-full object-contain" />}
        </div>
      ) : null}
    </div>
  );
}

export default function DocumentsPage() {
  return <Suspense fallback={<p className="text-sm text-slate-400">Loading documents…</p>}><DocumentsBody /></Suspense>;
}
