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
import SessionCountdownOrb from "@/components/SessionCountdownOrb";
import { I18nProvider } from "@/context/I18nContext";
import { SearchProvider } from "@/context/SearchContext";
import { SessionCountdownProvider } from "@/context/SessionCountdownContext";
import AccommodationDetail from "./pages/AccommodationDetail";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import Signup from "./pages/Signup";

const SESSION_FLOAT_VIEWPORT_BOTTOM =
  "calc(16px + env(safe-area-inset-bottom, 0px))";
const SESSION_FLOAT_CLEAR_FOOTER =
  "calc(var(--app-footer-height) + 16px + env(safe-area-inset-bottom, 0px))";

const getHeaderConfig = (
  pathname: string,
  isAuthenticated: boolean,
): React.ComponentProps<typeof Header> => {
  if (pathname === "/login" || pathname === "/signup")
    return { showFlag: true };
  if (isAuthenticated) {
    if (pathname.includes("/accommodation/"))
      return { showFlag: true, showMenu: true, showCart: true };

    return { showMenu: true, showFlag: true };
  }

  return { showFlag: true, showLogin: true };
};

const AppLayout = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, autoLoggedOut, clearAutoLoggedOut } = useAuth();

  const footerRef = useRef<HTMLElement>(null);
  const [footerInViewport, setFooterInViewport] = useState(false);

  const headerConfig = getHeaderConfig(pathname, isAuthenticated);
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
    <div className="app-layout">
      <Background />
      <div
        className={cn(
          "app-layout__content",
          pathname === "/cart" && "app-layout__content--cart",
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
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accommodation/:id"
              element={
                // <ProtectedRoute>
                //   <AccommodationDetail />
                // </ProtectedRoute>
                <AccommodationDetail />
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
              <AppLayout />
            </SessionCountdownProvider>
          </AuthProvider>
        </SearchProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
