const BASE = `${import.meta.env.VITE_API_URL || ""}/api`;

export async function fetchBills() {
  const res = await fetch(`${BASE}/bills`);
  if (!res.ok) throw new Error("Failed to load products");
  return res.json();
}

export async function extractBill(file) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${BASE}/extract-bill`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Extraction failed");
  }
  return res.json();
}

export async function saveBill(data) {
  const res = await fetch(`${BASE}/bills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save product");
  return res.json();
}

export async function deleteBill(id) {
  const res = await fetch(`${BASE}/bills/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete product");
}
