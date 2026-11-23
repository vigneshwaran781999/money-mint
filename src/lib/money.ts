/** Indian digit grouping: 12,34,567.89 */
function groupIndian(intPart: string): string {
  if (intPart.length <= 3) return intPart;
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

export function formatINR(value: number, opts: { sign?: boolean; decimals?: boolean } = {}): string {
  const n = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(n);
  const showDecimals = opts.decimals ?? abs % 1 !== 0;
  const fixed = abs.toFixed(showDecimals ? 2 : 0);
  const [i, d] = fixed.split('.');
  const body = `₹${groupIndian(i)}${d ? `.${d}` : ''}`;
  if (n < 0) return `-${body}`;
  if (opts.sign && n > 0) return `+${body}`;
  return body;
}

/** Short form for chart labels: ₹1.2L, ₹3.4Cr, ₹12K */
export function formatShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs)}`;
}

/** Parses user input like "1,250.50" → 1250.5; returns NaN when invalid. */
export function parseAmount(text: string): number {
  const cleaned = text.replace(/[₹,\s]/g, '');
  if (!/^\d*\.?\d{0,2}$/.test(cleaned) || cleaned === '' || cleaned === '.') return NaN;
  return Number(cleaned);
}
