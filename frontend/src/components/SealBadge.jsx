const STATUS_STYLE = {
  active: { ring: "border-sage", bg: "bg-sage-soft", text: "text-sage", label: "Protected" },
  expiring_soon: { ring: "border-brass", bg: "bg-brass-soft/40", text: "text-brass", label: "Expiring" },
  expired: { ring: "border-rust", bg: "bg-rust-soft", text: "text-rust", label: "Expired" },
  unknown: { ring: "border-ink-soft/30", bg: "bg-paper-dim", text: "text-ink-soft", label: "Unknown" },
};

export default function SealBadge({ status, daysRemaining, size = "md" }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.unknown;
  const dims = size === "lg" ? "w-24 h-24" : "w-16 h-16";
  const textSize = size === "lg" ? "text-2xl" : "text-lg";

  let display = "—";
  if (typeof daysRemaining === "number") {
    if (status === "expired") display = "0";
    else display = String(daysRemaining);
  }

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        className={`${dims} ${s.ring} ${s.bg} border-2 rounded-seal flex items-center justify-center rotate-[-4deg] shadow-sm`}
        style={{ borderStyle: "double", borderWidth: "3px" }}
      >
        <div className="flex flex-col items-center leading-none rotate-[4deg]">
          <span className={`font-mono font-semibold ${textSize} ${s.text}`}>{display}</span>
          {status !== "unknown" && <span className={`font-mono text-[9px] ${s.text} opacity-70`}>days</span>}
        </div>
      </div>
      <span className={`font-mono text-[10px] uppercase tracking-wider ${s.text}`}>{s.label}</span>
    </div>
  );
}
