import SealBadge from "./SealBadge.jsx";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatPrice(price, currency) {
  if (price === null || price === undefined) return "—";
  const symbol = currency === "INR" || !currency ? "₹" : currency + " ";
  return `${symbol}${Number(price).toLocaleString("en-IN")}`;
}

export default function ProductCard({ item, onDelete }) {
  return (
    <div className="bg-white border border-ink/10 rounded-2xl p-5 flex gap-4 items-start hover:shadow-md transition-shadow">
      <SealBadge status={item.status} daysRemaining={item.daysRemaining} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink truncate">
              {item.productName || "Unnamed product"}
            </h3>
            <p className="font-mono text-xs text-ink-soft mt-0.5">{item.category || "Uncategorized"}</p>
          </div>
          <button
            onClick={() => onDelete(item.id)}
            className="focus-ring text-ink-soft hover:text-rust text-sm shrink-0"
            aria-label="Remove product"
          >
            ✕
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 font-body text-sm">
          <div>
            <dt className="text-ink-soft text-xs">Seller</dt>
            <dd className="text-ink">{item.seller || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-soft text-xs">Price</dt>
            <dd className="text-ink font-mono">{formatPrice(item.price, item.currency)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft text-xs">Purchased</dt>
            <dd className="text-ink font-mono">{formatDate(item.purchaseDate)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft text-xs">Warranty expires</dt>
            <dd className="text-ink font-mono">{formatDate(item.warrantyExpiry)}</dd>
          </div>
        </dl>

        {item.notes && <p className="font-body text-xs text-ink-soft mt-3 italic">{item.notes}</p>}
      </div>
    </div>
  );
}
