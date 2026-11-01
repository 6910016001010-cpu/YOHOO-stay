export const SERVICE_FEE_RATE = 0.1;
export const VAT_RATE = 0.07;

export interface PriceBreakdown {
  nights: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
}

export function calculatePrice(ratePerNight: number, nights: number): PriceBreakdown {
  const subtotal = Math.max(0, Math.round(ratePerNight)) * Math.max(0, nights);
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const tax = Math.round((subtotal + serviceFee) * VAT_RATE);
  return {
    nights,
    subtotal,
    serviceFee,
    tax,
    total: subtotal + serviceFee + tax,
  };
}

export function formatTHB(value: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("th-TH").format(Number.isFinite(value) ? value : 0);
}
