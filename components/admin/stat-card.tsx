import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  note?: string;
  delta?: number;
  deltaLabel?: string;
  tone?: "forest" | "lime" | "amber" | "blue";
}

export function StatCard({ label, value, icon: Icon, note, delta, deltaLabel, tone = "forest" }: StatCardProps) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-top">
        <span className="stat-icon">
          <Icon size={18} />
        </span>
        {typeof delta === "number" && (
          <span className={`stat-delta ${delta >= 0 ? "up" : "down"}`}>
            {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {(note || deltaLabel) && <p className="stat-note">{note ?? deltaLabel}</p>}
    </article>
  );
}
