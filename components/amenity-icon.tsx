import {
  Bath,
  BriefcaseBusiness,
  Car,
  Coffee,
  Snowflake,
  Sun,
  Tv,
  UtensilsCrossed,
  Waves,
  Wifi,
} from "lucide-react";

const ICONS = {
  wifi: Wifi,
  snowflake: Snowflake,
  tv: Tv,
  coffee: Coffee,
  waves: Waves,
  car: Car,
  bath: Bath,
  utensils: UtensilsCrossed,
  briefcase: BriefcaseBusiness,
  sun: Sun,
} as const;

export function AmenityIcon({ icon, size = 16 }: { icon: string; size?: number }) {
  const Icon = ICONS[icon as keyof typeof ICONS] ?? Wifi;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}
