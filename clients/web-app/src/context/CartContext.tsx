import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useSessionCountdown } from "@/context/SessionCountdownContext";
import { cancelBooking, getUserBookings } from "@/services/bookingService";
import type { CartLineItem } from "@/types/cart";
import {
  clearCheckoutSession,
  saveCheckoutSession,
} from "@/utils/checkoutSession";

export type CartLineFromHoldInput = {
  bookingId: string;
  roomId: number;
  hotelName: string;
  roomName: string;
  image: string;
  amount: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  expiresAt?: string | null;
};

export const cartStorageKey = (userId: number) => `travelhub_cart_v1_${userId}`;

function parseStored(raw: string | null): CartLineFromHoldInput[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isValidStoredLine);
  } catch {
    return [];
  }
}

function isValidStoredLine(x: unknown): x is CartLineFromHoldInput {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.bookingId === "string" &&
    typeof o.roomId === "number" &&
    typeof o.hotelName === "string" &&
    typeof o.roomName === "string" &&
    typeof o.image === "string" &&
    typeof o.amount === "number" &&
    typeof o.currency === "string" &&
    typeof o.checkIn === "string" &&
    typeof o.checkOut === "string"
  );
}

function toCartLineItem(line: CartLineFromHoldInput): CartLineItem {
  return {
    id: line.bookingId,
    name: `${line.hotelName} · ${line.roomName}`,
    image: line.image,
    price: { amount: line.amount, currency: line.currency },
    breakdown: {
      stayBase: line.amount,
      charges: 0,
      taxes: 0,
      insurance: 0,
      discount: 0,
    },
  };
}

type CartContextValue = {
  items: CartLineItem[];
  itemCount: number;
  addLineFromHold: (line: CartLineFromHoldInput) => void;
  removeLine: (bookingId: string) => Promise<void>;
  refreshFromServer: () => Promise<void>;
  clearCart: () => void;
  isSyncing: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useAuth();
  const userId = session?.user.user_id ?? null;
  const { stop: stopHoldCountdown } = useSessionCountdown();
  const [rawLines, setRawLines] = useState<CartLineFromHoldInput[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const skipNextPersistRef = useRef(false);
  const prevCartCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (userId == null) {
      prevCartCountRef.current = null;
      setRawLines([]);
      return;
    }
    skipNextPersistRef.current = true;
    prevCartCountRef.current = null;
    setRawLines(parseStored(localStorage.getItem(cartStorageKey(userId))));
  }, [userId]);

  useEffect(() => {
    const n = rawLines.length;
    if (prevCartCountRef.current === null) {
      prevCartCountRef.current = n;
      return;
    }
    if (prevCartCountRef.current > 0 && n === 0) {
      stopHoldCountdown();
    }
    prevCartCountRef.current = n;
  }, [rawLines.length, stopHoldCountdown]);

  useEffect(() => {
    const bookingIds = rawLines.map((line) => line.bookingId);
    if (bookingIds.length === 0) {
      clearCheckoutSession();
      return;
    }
    saveCheckoutSession(bookingIds, undefined, "cart");
  }, [rawLines]);

  useEffect(() => {
    if (userId == null) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    localStorage.setItem(cartStorageKey(userId), JSON.stringify(rawLines));
  }, [rawLines, userId]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      setRawLines((prev) => {
        const filtered = prev.filter((l) => {
          if (!l.expiresAt) return true;
          return new Date(l.expiresAt).getTime() > now;
        });
        if (filtered.length === prev.length) return prev;
        return filtered;
      });
    };
    const id = window.setInterval(tick, 10_000);
    tick();
    return () => window.clearInterval(id);
  }, []);

  const refreshFromServer = useCallback(async () => {
    if (!session || userId == null) return;
    setIsSyncing(true);
    try {
      const data = await getUserBookings(String(session.user.user_id));
      const onHold = new Set(
        data.bookings
          .filter((b) => b.status === "ON_HOLD")
          .map((b) => b.booking_id),
      );
      setRawLines((prev) => prev.filter((l) => onHold.has(l.bookingId)));
    } finally {
      setIsSyncing(false);
    }
  }, [session, userId]);

  const addLineFromHold = useCallback(
    (line: CartLineFromHoldInput) => {
      if (!session) return;
      setRawLines((prev) => {
        const rest = prev.filter((l) => l.bookingId !== line.bookingId);
        return [...rest, line];
      });
    },
    [session],
  );

  const removeLine = useCallback(async (bookingId: string) => {
    try {
      await cancelBooking(bookingId);
    } catch {
      return;
    }
    setRawLines((prev) => prev.filter((l) => l.bookingId !== bookingId));
  }, []);

  const clearCart = useCallback(() => {
    skipNextPersistRef.current = true;
    setRawLines([]);
    if (userId != null) {
      localStorage.removeItem(cartStorageKey(userId));
    }
  }, [userId]);

  const items = useMemo(() => rawLines.map(toCartLineItem), [rawLines]);
  const itemCount = rawLines.length;

  const value = useMemo(
    () => ({
      items,
      itemCount,
      addLineFromHold,
      removeLine,
      refreshFromServer,
      clearCart,
      isSyncing,
    }),
    [
      items,
      itemCount,
      addLineFromHold,
      removeLine,
      refreshFromServer,
      clearCart,
      isSyncing,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
