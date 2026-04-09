import type { DateRange } from "react-day-picker";
import type { CommittedSearchPayload, Guests } from "@/types/search";
import { GUESTS_DEFAULTS } from "@/types/search";

export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseLocalYmd(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function addDaysLocal(from: Date, days: number): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}

export function committedSearchToUrlParams(
  payload: CommittedSearchPayload,
): URLSearchParams {
  const p = new URLSearchParams();
  const dest = payload.destination.trim();
  if (dest) p.set("destination", dest);
  if (payload.dateRange?.from && payload.dateRange?.to) {
    p.set("checkIn", formatLocalYmd(payload.dateRange.from));
    p.set("checkOut", formatLocalYmd(payload.dateRange.to));
  }
  p.set("adults", String(payload.guests.adults));
  p.set("children", String(payload.guests.children));
  p.set("rooms", String(payload.guests.rooms));
  if (payload.guests.pets) p.set("pets", "true");
  return p;
}

export function committedSearchFromUrlParams(
  params: URLSearchParams,
): CommittedSearchPayload | null {
  const destination = params.get("destination")?.trim();
  const checkIn = params.get("checkIn");
  const checkOut = params.get("checkOut");
  if (!destination || !checkIn || !checkOut) return null;

  const from = parseLocalYmd(checkIn);
  const to = parseLocalYmd(checkOut);
  if (!from || !to) return null;

  const adults = Number.parseInt(params.get("adults") ?? "", 10);
  const children = Number.parseInt(params.get("children") ?? "", 10);
  const rooms = Number.parseInt(params.get("rooms") ?? "", 10);

  if (!Number.isFinite(adults) || adults < 1) return null;
  if (!Number.isFinite(children) || children < 0) return null;
  if (!Number.isFinite(rooms) || rooms < 1) return null;

  const petsRaw = params.get("pets");
  const pets = petsRaw === "true" || petsRaw === "1";

  const dateRange: DateRange = { from, to };
  const guests: Guests = { adults, children, rooms, pets };

  return { destination, dateRange, guests };
}

export function defaultCommittedSearch(): CommittedSearchPayload {
  const from = new Date();
  from.setHours(12, 0, 0, 0);
  const to = addDaysLocal(from, 1);
  return {
    destination: "",
    dateRange: { from, to },
    guests: { ...GUESTS_DEFAULTS },
  };
}

export function normalizeCommittedSearch(
  payload: CommittedSearchPayload,
): CommittedSearchPayload {
  return {
    destination: payload.destination.trim(),
    dateRange: payload.dateRange,
    guests: { ...payload.guests },
  };
}

export function committedSearchEqual(
  a: CommittedSearchPayload,
  b: CommittedSearchPayload,
): boolean {
  if (a.destination !== b.destination) return false;
  const af = a.dateRange?.from?.getTime();
  const bf = b.dateRange?.from?.getTime();
  const at = a.dateRange?.to?.getTime();
  const bt = b.dateRange?.to?.getTime();
  if (af !== bf || at !== bt) return false;
  const ga = a.guests;
  const gb = b.guests;
  return (
    ga.adults === gb.adults &&
    ga.children === gb.children &&
    ga.rooms === gb.rooms &&
    ga.pets === gb.pets
  );
}

export function committedSearchFromSearchState(
  destination: string,
  dateRange: DateRange | undefined,
  guests: Guests,
): CommittedSearchPayload {
  return {
    destination,
    dateRange,
    guests: { ...guests },
  };
}
