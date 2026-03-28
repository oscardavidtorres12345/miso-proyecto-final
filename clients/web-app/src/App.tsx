import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Background from "@/components/Background";
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { cn } from '@/lib/utils'
import { I18nProvider } from "@/context/I18nContext";
import { SearchProvider } from "@/context/SearchContext";
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

const AppLayout = () => {
  const { pathname } = useLocation()
  const config = headerConfig[pathname] ?? {}

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
          <Route path="/cart" element={<Cart />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <SearchProvider>
          <AppLayout />
        </SearchProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}

export default App;
