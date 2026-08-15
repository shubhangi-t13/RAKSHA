import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import EmptyState from "./components/EmptyState.jsx";
import ProductCard from "./components/ProductCard.jsx";
import UploadModal from "./components/UploadModal.jsx";
import { fetchBills, deleteBill } from "./lib/api.js";

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await fetchBills();
      setItems(data);
    } catch (err) {
      setError("Could not reach the Raksha backend. Is it running on port 4000?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteBill(id);
    } catch {
      load(); // resync on failure
    }
  }

  function handleSaved(newItem) {
    setShowUpload(false);
    load();
  }

  const expiringSoon = items.filter((i) => i.status === "expiring_soon");

  return (
    <div className="min-h-screen bg-paper">
      <Header onAddClick={() => setShowUpload(true)} count={items.length} />

      <main className="max-w-3xl mx-auto px-5 py-6">
        {error && (
          <div className="bg-rust-soft text-rust font-body text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
        )}

        {!loading && expiringSoon.length > 0 && (
          <div className="bg-brass-soft/40 border border-brass/40 rounded-xl px-4 py-3 mb-5 font-body text-sm text-ink">
            ⚠️ {expiringSoon.length} warrant{expiringSoon.length === 1 ? "y" : "ies"} expiring within 30 days
          </div>
        )}

        {loading && <p className="font-mono text-sm text-ink-soft text-center py-10">Loading your locker…</p>}

        {!loading && items.length === 0 && !error && <EmptyState onAddClick={() => setShowUpload(true)} />}

        {!loading && items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <ProductCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSaved={handleSaved} />}
    </div>
  );
}
