import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Background from "@/components/Background";
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { cn } from '@/lib/utils'
import SessionCountdownOrb from '@/components/SessionCountdownOrb'
import { I18nProvider } from "@/context/I18nContext";
import { SearchProvider } from "@/context/SearchContext";
import { SessionCountdownProvider } from '@/context/SessionCountdownContext'
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import Signup from "./pages/Signup";

const headerConfig: Record<string, React.ComponentProps<typeof Header>> = {
  '/': { showLogin: true, showFlag: true },
  '/login': { showFlag: true },
  '/signup': { showFlag: true },
  '/search': { showFlag: true },
  '/cart': { showFlag: true },
}

const SESSION_FLOAT_VIEWPORT_BOTTOM =
  'calc(16px + env(safe-area-inset-bottom, 0px))'
const SESSION_FLOAT_CLEAR_FOOTER =
  'calc(var(--app-footer-height) + 16px + env(safe-area-inset-bottom, 0px))'

const AppLayout = () => {
  const { pathname } = useLocation()
  const config = headerConfig[pathname] ?? {}
  const footerRef = useRef<HTMLElement>(null)
  const [footerInViewport, setFooterInViewport] = useState(false)

  useEffect(() => {
    const el = footerRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => setFooterInViewport(entry?.isIntersecting ?? false),
      { root: null, threshold: 0, rootMargin: '0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const sessionBottom = footerInViewport ? SESSION_FLOAT_CLEAR_FOOTER : SESSION_FLOAT_VIEWPORT_BOTTOM

  return (
    <div className="app-layout">
      <Background />
      <div
        className={cn('app-layout__content', pathname === '/cart' && 'app-layout__content--cart')}
        style={{ ['--session-countdown-bottom' as string]: sessionBottom }}
      >
        <Header {...config} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer ref={footerRef} />
        <SessionCountdownOrb />
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <SearchProvider>
          <SessionCountdownProvider>
            <AppLayout />
          </SessionCountdownProvider>
        </SearchProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
