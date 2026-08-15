export default function Header({ onAddClick, count }) {
  return (
    <header className="bg-ink text-paper">
      <div className="max-w-3xl mx-auto px-5 py-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Raksha</h1>
          <p className="font-mono text-[11px] uppercase tracking-widest text-brass-soft mt-0.5">
            Digital Warranty Locker
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="focus-ring bg-brass text-ink font-body font-semibold text-sm px-4 py-2 rounded-full hover:bg-brass-soft transition-colors"
        >
          + Add bill
        </button>
      </div>
      {count > 0 && (
        <div className="max-w-3xl mx-auto px-5 pb-4 -mt-1">
          <p className="text-ink-soft text-paper/60 text-sm font-body">
            {count} product{count !== 1 ? "s" : ""} in your locker
          </p>
        </div>
      )}
    </header>
  );
}
