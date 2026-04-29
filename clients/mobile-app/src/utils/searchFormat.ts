function safeDate(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  const d = new Date(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateRangeLabel(checkIn: string, checkOut: string): string {
  const from = safeDate(checkIn);
  const to = safeDate(checkOut);
  if (!from || !to) return `${checkIn} - ${checkOut}`;
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const locale = 'es-CO';
  return `${new Intl.DateTimeFormat(locale, opts).format(from)} – ${new Intl.DateTimeFormat(locale, opts).format(to)}`;
}

export function formatGuestsLabel(adults: number, children: number): string {
  const total = adults + children;
  return `${total} huésped${total !== 1 ? 'es' : ''}`;
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
