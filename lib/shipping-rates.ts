export type ShippingRates = {
  postnord: number;
  shipmondo: number;
  weightKg: number;
  currency: string;
};

const DEFAULT_RATES: ShippingRates = {
  postnord: 85.36,
  shipmondo: 81.09,
  weightKg: 1,
  currency: "SEK",
};

export async function fetchShippingRates(
  websiteUrl: string,
  weightKg = 1,
): Promise<ShippingRates> {
  const base = websiteUrl.replace(/\/+$/, "");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${base}/api/shipping/rates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: weightKg }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { ...DEFAULT_RATES, weightKg };
    const data = await res.json();
    return {
      postnord: Number(data.postnord) || DEFAULT_RATES.postnord,
      shipmondo: Number(data.shipmondo) || DEFAULT_RATES.shipmondo,
      weightKg,
      currency: "SEK",
    };
  } catch {
    return { ...DEFAULT_RATES, weightKg };
  }
}

export function formatShippingComparison(rates: ShippingRates): string {
  const save = (rates.postnord - rates.shipmondo).toFixed(0);
  return (
    `For ~${rates.weightKg} kg: **PostNord** ${rates.postnord} ${rates.currency} (2–5 business days) ` +
    `vs **Shipmondo** ${rates.shipmondo} ${rates.currency} (~${save} ${rates.currency} less). ` +
    `Which carrier would you like — PostNord or Shipmondo?`
  );
}