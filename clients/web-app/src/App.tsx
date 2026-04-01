import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Background from "@/components/Background";
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Snackbar from '@/components/Snackbar'
import { cn } from '@/lib/utils'
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { I18nProvider } from "@/context/I18nContext";
import { SearchProvider } from "@/context/SearchContext";
import Cart from "./pages/Cart";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import Signup from "./pages/Signup";

const getHeaderConfig = (pathname: string, isAuthenticated: boolean): React.ComponentProps<typeof Header> => {
  if (pathname === '/login' || pathname === '/signup') return { showFlag: true }
  if (isAuthenticated) return { showMenu: true, showFlag: true }

  return { showFlag: true, showLogin: true }
}

const AppLayout = () => {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const { isAuthenticated, autoLoggedOut, clearAutoLoggedOut } = useAuth()
  const config = getHeaderConfig(pathname, isAuthenticated)

  return (
    <div className="app-layout">
      <Background />
      <div
        className={cn('app-layout__content', pathname === '/cart' && 'app-layout__content--cart')}
      >
        <Header {...config} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>

      <Snackbar
        show={autoLoggedOut}
        message={t('login.sessionExpired')}
        variant="error"
        onClose={clearAutoLoggedOut}
        duration={6000}
      />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <SearchProvider>
          <AuthProvider>
            <AppLayout />
          </AuthProvider>
        </SearchProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
