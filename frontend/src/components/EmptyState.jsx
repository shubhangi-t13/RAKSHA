export default function EmptyState({ onAddClick }) {
  return (
    <div className="max-w-3xl mx-auto px-5 py-20 text-center">
      <div className="w-20 h-20 mx-auto rounded-seal border-2 border-dashed border-ink-soft/30 flex items-center justify-center mb-5">
        <span className="text-3xl">🧾</span>
      </div>
      <h2 className="font-display text-2xl font-semibold text-ink mb-2">Your locker is empty</h2>
      <p className="font-body text-ink-soft max-w-sm mx-auto mb-6">
        Photograph a bill and Raksha turns it into a warranty record — product, price, seller,
        and expiry date, extracted automatically.
      </p>
      <button
        onClick={onAddClick}
        className="focus-ring bg-ink text-paper font-body font-semibold text-sm px-6 py-3 rounded-full hover:bg-ink-soft transition-colors"
      >
        Photograph your first bill
      </button>
    </div>
  );
}
