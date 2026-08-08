export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-brand-gold/20 bg-brand-gold/10 px-4 py-1.5 text-center text-xs text-yellow-200/90">
      <span aria-hidden>🧪</span>
      <span>
        <strong>Demo mode</strong> — seeded data, destructive & outbound actions are disabled. Not for
        production use.
      </span>
    </div>
  );
}
