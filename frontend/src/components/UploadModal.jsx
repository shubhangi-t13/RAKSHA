import { useState, useRef } from "react";
import { extractBill, saveBill } from "../lib/api.js";

const STEPS = { PICK: "pick", EXTRACTING: "extracting", REVIEW: "review", ERROR: "error" };

export default function UploadModal({ onClose, onSaved }) {
  const [step, setStep] = useState(STEPS.PICK);
  const [preview, setPreview] = useState(null);
  const [isPdfFile, setIsPdfFile] = useState(false);
  const [form, setForm] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setIsPdfFile(file.type === "application/pdf");
    setPreview(URL.createObjectURL(file));
    setStep(STEPS.EXTRACTING);
    try {
      const extracted = await extractBill(file);
      setForm(extracted);
      setStep(STEPS.REVIEW);
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong reading the bill.");
      setStep(STEPS.ERROR);
    }
  }

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Recompute expiry when purchase date or duration changes
  function recomputeExpiry(next) {
    if (next.purchaseDate && next.warrantyDurationMonths) {
      const d = new Date(next.purchaseDate);
      if (!isNaN(d)) {
        d.setMonth(d.getMonth() + Number(next.warrantyDurationMonths));
        next.warrantyExpiry = d.toISOString().slice(0, 10);
      }
    }
    return next;
  }

  function handleFieldChange(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "purchaseDate" || key === "warrantyDurationMonths") return recomputeExpiry(next);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveBill(form);
      onSaved(saved);
    } catch (err) {
      setErrorMsg(err.message || "Could not save.");
      setStep(STEPS.ERROR);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-paper w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-paper border-b border-ink/10 px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Add a bill</h2>
          <button onClick={onClose} className="focus-ring text-ink-soft hover:text-ink text-lg" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="p-5">
          {step === STEPS.PICK && (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto rounded-seal bg-brass-soft/40 border-2 border-brass flex items-center justify-center mb-4 text-2xl">
                📷
              </div>
              <p className="font-body text-ink-soft mb-6 text-sm">
                Take a photo, choose an image, or upload a PDF bill.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="focus-ring bg-ink text-paper font-semibold text-sm px-6 py-3 rounded-full hover:bg-ink-soft transition-colors"
                >
                  Take photo
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="focus-ring border border-ink text-ink font-semibold text-sm px-6 py-3 rounded-full hover:bg-ink/5 transition-colors"
                >
                  Choose from gallery
                </button>
                <button
                  onClick={() => pdfInputRef.current?.click()}
                  className="focus-ring border border-ink text-ink font-semibold text-sm px-6 py-3 rounded-full hover:bg-ink/5 transition-colors"
                >
                  Upload PDF
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}

          {step === STEPS.EXTRACTING && (
            <div className="text-center py-10">
              {preview && !isPdfFile && (
                <img src={preview} alt="Bill preview" className="max-h-48 mx-auto rounded-xl mb-5 opacity-70 rotate-1" />
              )}
              {preview && isPdfFile && (
                <div className="mx-auto mb-5 w-16 h-20 bg-paper-dim border border-ink/15 rounded-lg flex items-center justify-center text-2xl">
                  📄
                </div>
              )}
              <div className="w-10 h-10 mx-auto border-2 border-brass border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-body text-ink-soft text-sm">Reading your bill…</p>
            </div>
          )}

          {step === STEPS.REVIEW && form && (
            <div className="space-y-4">
              {preview && !isPdfFile && <img src={preview} alt="Bill preview" className="max-h-40 mx-auto rounded-xl" />}
              {preview && isPdfFile && (
                <div className="mx-auto w-14 h-16 bg-paper-dim border border-ink/15 rounded-lg flex items-center justify-center text-xl">
                  📄
                </div>
              )}
              <p className="font-mono text-[10px] uppercase tracking-wider text-brass text-center">
                Check the details below
              </p>

              <Field label="Product" value={form.productName} onChange={(v) => handleFieldChange("productName", v)} />
              <Field label="Category" value={form.category} onChange={(v) => handleFieldChange("category", v)} />
              <Field label="Seller" value={form.seller} onChange={(v) => handleFieldChange("seller", v)} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (₹)" type="number" value={form.price} onChange={(v) => handleFieldChange("price", Number(v))} />
                <Field
                  label="Purchase date"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(v) => handleFieldChange("purchaseDate", v)}
                />
              </div>
              <Field
                label="Warranty (months)"
                type="number"
                value={form.warrantyDurationMonths}
                onChange={(v) => handleFieldChange("warrantyDurationMonths", Number(v))}
              />
              <Field label="Warranty expires" type="date" value={form.warrantyExpiry} onChange={(v) => handleFieldChange("warrantyExpiry", v)} />
              <Field label="Notes" value={form.notes} onChange={(v) => handleFieldChange("notes", v)} textarea />

              <button
                onClick={handleSave}
                disabled={saving}
                className="focus-ring w-full bg-brass text-ink font-semibold text-sm px-6 py-3 rounded-full hover:bg-brass-soft transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save to locker"}
              </button>
            </div>
          )}

          {step === STEPS.ERROR && (
            <div className="text-center py-8">
              <p className="font-body text-rust text-sm mb-4">{errorMsg}</p>
              <button
                onClick={() => setStep(STEPS.PICK)}
                className="focus-ring bg-ink text-paper font-semibold text-sm px-6 py-3 rounded-full"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea = false }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">{label}</span>
      {textarea ? (
        <textarea
          className="focus-ring w-full mt-1 border border-ink/15 rounded-lg px-3 py-2 font-body text-sm bg-white"
          rows={2}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="focus-ring w-full mt-1 border border-ink/15 rounded-lg px-3 py-2 font-body text-sm bg-white"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
