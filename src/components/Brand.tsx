import { Link } from "react-router"

export function Brand({
  light = false,
  compact = false,
}: {
  light?: boolean
  compact?: boolean
}) {
  return (
    <Link
      to="/"
      className="group flex items-center gap-3"
      aria-label="SME FinanceHub home"
    >
      <img
        src="/SME%20FinanceHub%20Growth%20Icon.png"
        alt=""
        className="size-10 shrink-0 rounded-xl object-cover shadow-sm"
      />
      {!compact && (
        <span
          className={`text-lg font-bold tracking-tight ${
            light ? "text-white" : "text-ink"
          }`}
        >
          SME{" "}
          <span className={light ? "text-mint" : "text-brand-blue"}>
            FinanceHub
          </span>
        </span>
      )}
    </Link>
  )
}
