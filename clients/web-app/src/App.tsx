import { BrowserRouter, Route, Routes } from "react-router-dom";
import Background from "@/components/Background";
import { SearchProvider } from "@/context/SearchContext";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";

function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <div className="relative min-h-screen">
          <Background />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchResults />} />
          </Routes>
        </div>
      </SearchProvider>
    </BrowserRouter>
  );
}

export default App;
