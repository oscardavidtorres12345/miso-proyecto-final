import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "@/components/Background";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Snackbar from "@/components/Snackbar";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { UserRole } from "@/types/user";
import SessionCountdownOrb from "@/components/SessionCountdownOrb";
import { I18nProvider } from "@/context/I18nContext";
import { SearchProvider } from "@/context/SearchContext";
import HoldExpiredBridge from "@/components/HoldExpiredBridge";
import { CartProvider } from "@/context/CartContext";
import { SessionCountdownProvider } from "@/context/SessionCountdownContext";
import Sidebar from "@/components/Sidebar";
import AccommodationDetail from "./pages/AccommodationDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyReservations from "./pages/MyReservations";
import PastTrips from "./pages/PastTrips";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import PortalDashboard from "./pages/PortalDashboard";
import SearchResults from "./pages/SearchResults";
import Signup from "./pages/Signup";

const SESSION_FLOAT_VIEWPORT_BOTTOM =
  "calc(16px + env(safe-area-inset-bottom, 0px))";
const SESSION_FLOAT_CLEAR_FOOTER =
  "calc(var(--app-footer-height) + 16px + env(safe-area-inset-bottom, 0px))";

type HeaderConfig = React.ComponentProps<typeof Header>

const HEADER_CONFIGS = {
  public: { showFlag: true, showLogo: true },
  unauthenticated: { showFlag: true, showLogin: true, showLogo: true },
  guest: { showMenu: true, showFlag: true, showCart: true, showLogo: true },
  staff: { showMenu: true, showFlag: true },
} satisfies Record<string, HeaderConfig>

const PUBLIC_PATHS = new Set(["/login", "/signup"])

export const getHeaderConfig = (
  pathname: string,
  isAuthenticated: boolean,
  role: string | null,
): HeaderConfig => {
  if (PUBLIC_PATHS.has(pathname)) return HEADER_CONFIGS.public
  if (!isAuthenticated) return HEADER_CONFIGS.unauthenticated
  return role === UserRole.STAFF ? HEADER_CONFIGS.staff : HEADER_CONFIGS.guest
};

const AppLayout = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, autoLoggedOut, clearAutoLoggedOut, session } = useAuth();

  const footerRef = useRef<HTMLElement>(null);
  const [footerInViewport, setFooterInViewport] = useState(false);

  const role = session?.user.role ?? null;
  const isStaff = role === UserRole.STAFF;
  const headerConfig = getHeaderConfig(pathname, isAuthenticated, role);
  const sessionBottom = footerInViewport
    ? SESSION_FLOAT_CLEAR_FOOTER
    : SESSION_FLOAT_VIEWPORT_BOTTOM;

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => setFooterInViewport(entry?.isIntersecting ?? false),
      { root: null, threshold: 0, rootMargin: "0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={cn("app-layout", isStaff && "app-layout--with-sidebar")}>
      <Background />
      {isStaff && <Sidebar />}
      <div
        className={cn(
          "app-layout__content",
          (pathname === "/cart" || pathname === "/checkout") &&
            "app-layout__content--cart",
        )}
        style={{ ["--session-countdown-bottom" as string]: sessionBottom }}
      >
        <Header {...headerConfig} />
        <main className="app-layout__main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/search" element={<SearchResults />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute allowedRoles={[UserRole.GUEST]}>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accommodation/:id"
              element={
                <ProtectedRoute allowedRoles={[UserRole.GUEST]}>
                  <AccommodationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={[UserRole.GUEST]}>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute allowedRoles={[UserRole.GUEST]}>
                  <MyReservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/past-trips"
              element={
                <ProtectedRoute allowedRoles={[UserRole.GUEST]}>
                  <PastTrips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portal/dashboard"
              element={
                <ProtectedRoute allowedRoles={[UserRole.STAFF]}>
                  <PortalDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer ref={footerRef} />
        <SessionCountdownOrb />
      </div>

      <Snackbar
        show={autoLoggedOut}
        message={t("login.sessionExpired")}
        variant="error"
        onClose={clearAutoLoggedOut}
        duration={6000}
      />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <SearchProvider>
          <AuthProvider>
            <SessionCountdownProvider>
              <CartProvider>
                <HoldExpiredBridge />
                <AppLayout />
              </CartProvider>
            </SessionCountdownProvider>
          </AuthProvider>
        </SearchProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
