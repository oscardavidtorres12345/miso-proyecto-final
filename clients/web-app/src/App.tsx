import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Background from "@/components/Background";
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { SearchProvider } from "@/context/SearchContext";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";

const headerConfig: Record<string, React.ComponentProps<typeof Header>> = {
  '/': { showLogin: true, showFlag: true },
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
        <Route path="/search" element={<SearchResults />} />
      </Routes>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <AppLayout />
      </SearchProvider>
    </BrowserRouter>
  );
}

export default App;
