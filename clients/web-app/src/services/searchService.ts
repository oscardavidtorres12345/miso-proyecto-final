import type {
  SearchFiltersQuery,
  SearchFiltersResponse,
  SearchPropertiesQuery,
  SearchPropertiesResponse,
} from "@/types/searchApi";

function resolveBaseUrl(): string {
  const base = import.meta.env.VITE_SEARCH_API_URL as string | undefined;
  if (typeof base !== "string" || !base.trim()) {
    throw new Error("VITE_SEARCH_API_URL is not defined. Set it in .env.");
  }
  return base.replace(/\/$/, "");
}

function appendArray(
  params: URLSearchParams,
  key: string,
  values?: Array<string | number>,
): void {
  if (!values || values.length === 0) return;
  values.forEach((value) => params.append(key, String(value)));
}

export async function getSearchFilters(
  query: SearchFiltersQuery,
): Promise<SearchFiltersResponse> {
  const baseUrl = resolveBaseUrl();
  const params = new URLSearchParams({
    destination: query.destination,
    check_in: query.checkIn,
    check_out: query.checkOut,
  });
  const response = await fetch(`${baseUrl}/search/filters?${params.toString()}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch search filters.");
  }

  return (await response.json()) as SearchFiltersResponse;
}

export async function getSearchProperties(
  query: SearchPropertiesQuery,
): Promise<SearchPropertiesResponse> {
  const baseUrl = resolveBaseUrl();
  const params = new URLSearchParams({
    destination: query.destination,
    check_in: query.checkIn,
    check_out: query.checkOut,
    adults: String(query.adults ?? 1),
    children: String(query.children ?? 0),
    rooms: String(query.rooms ?? 1),
    pets: String(query.pets ?? false),
    page: String(query.page ?? 1),
    page_size: String(query.pageSize ?? 10),
  });

  if (typeof query.priceMin === "number") params.set("price_min", String(query.priceMin));
  if (typeof query.priceMax === "number") params.set("price_max", String(query.priceMax));
  if (query.mealPlan) params.set("meal_plan", query.mealPlan);

  appendArray(params, "amenities", query.amenities);
  appendArray(params, "accommodation_type", query.accommodationType);
  appendArray(params, "stars", query.stars);

  const response = await fetch(
    `${baseUrl}/search/properties?${params.toString()}`,
    { method: "GET" },
  );

  if (!response.ok) {
    const error = new Error("Failed to fetch properties.") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as SearchPropertiesResponse;
}
