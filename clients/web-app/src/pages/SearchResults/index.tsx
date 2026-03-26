import Container from "@/components/Container";
import FilterGroup from "@/components/FilterGroup";
import PriceFilter from "@/components/PriceFilter";
import SearchFilterPanel from "@/components/SearchFilterPanel";
import "./SearchResults.css";

const ACCOMMODATION_TYPES: { id: string; label: string }[] = [
  { id: "hotel", label: "Hoteles" },
  { id: "house", label: "Casas" },
  { id: "cabin", label: "Cabañas" },
  { id: "hostel", label: "Hostales" },
  { id: "villa", label: "Villas" },
  { id: "resort", label: "Resorts" },
];

const SERVICES: { id: string; label: string }[] = [
  { id: "parking", label: "Estacionamientos" },
  { id: "pool", label: "Piscina" },
  { id: "pets", label: "Acepta mascotas" },
  { id: "kids", label: "Servicios para niños" },
  { id: "bathtub", label: "Bañera" },
  { id: "restaurant", label: "Restaurante" },
  { id: "spa", label: "Spa" },
  { id: "gym", label: "Gimnasio" },
  { id: "wifi", label: "WiFi gratuito" },
  { id: "ac", label: "Aire acondicionado" },
];

const MEALS: { id: string; label: string }[] = [
  { id: "breakfast", label: "Desayuno" },
  { id: "buffet", label: "Desayuno buffet" },
  { id: "allinclusive", label: "All inclusive" },
];

const SearchResults = () => (
  <main className="search-results-page page-section">
    <Container>
      <div className="search-results-page__grid">
        <aside className="search-results-page__filters">
          <SearchFilterPanel />
          <PriceFilter />
          <FilterGroup title="Servicios" options={SERVICES} withSearch />
          <FilterGroup
            title="Tipo de alojamiento"
            options={ACCOMMODATION_TYPES}
          />
          <FilterGroup title="Alimentación" options={MEALS} />
        </aside>
        <section className="search-results-page__content"></section>
      </div>
    </Container>
  </main>
);

export default SearchResults;
