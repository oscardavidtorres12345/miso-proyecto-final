import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Background from "@/components/Background";
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { I18nProvider } from "@/context/I18nContext";
import { SearchProvider } from "@/context/SearchContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SearchResults from "./pages/SearchResults";
import Signup from "./pages/Signup";

const headerConfig: Record<string, React.ComponentProps<typeof Header>> = {
  '/': { showLogin: true, showFlag: true },
  '/login': { showFlag: true },
  '/signup': { showFlag: true },
  '/search': { showFlag: true },
}

const AppLayout = () => {
  const { pathname } = useLocation()
  const config = headerConfig[pathname] ?? {}

  return (
    <div className="relative min-h-screen">
      <Background />
      <Header {...config} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/search" element={<SearchResults />} />
      </Routes>
      <Footer />
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
