/**
 * Lightweight HTTP mock server for E2E tests.
 * Handles /api/v1/search/properties and /api/v1/search/filters
 * so Detox tests can run without a real backend in CI.
 *
 * Android emulator reaches the host via 10.0.2.2; iOS simulator uses localhost.
 * Set EXPO_PUBLIC_SEARCH_URL accordingly before building the app.
 */

'use strict';

const http = require('http');

const PORT = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 3001;

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const ACCOMMODATIONS = [
  {
    id: 1,
    name: 'Hotel Caribe Cartagena',
    image: '',
    distanceFromCenter: 0.5,
    stars: 5,
    rating: { score: 9.2, reviewCount: 312 },
    amenities: [{ id: 'wifi' }, { id: 'pool' }, { id: 'parking' }],
    hasBreakfast: true,
    price: { perNight: 350000, currency: 'COP' },
  },
  {
    id: 2,
    name: 'Apartamentos Bocagrande',
    image: '',
    distanceFromCenter: 1.2,
    stars: 4,
    rating: { score: 8.5, reviewCount: 88 },
    amenities: [{ id: 'wifi' }, { id: 'ac' }],
    hasBreakfast: false,
    price: { perNight: 180000, currency: 'COP' },
  },
  {
    id: 3,
    name: 'Hostal El Centenario',
    image: '',
    distanceFromCenter: 0.3,
    stars: 3,
    rating: { score: 7.8, reviewCount: 55 },
    amenities: [{ id: 'wifi' }],
    hasBreakfast: false,
    price: { perNight: 85000, currency: 'COP' },
  },
];

// 7 amenities to ensure the FilterGroup "Ver más" button appears (threshold = 6)
const FILTERS = {
  amenities: [
    { id: 'wifi', name: 'WiFi' },
    { id: 'pool', name: 'Piscina' },
    { id: 'parking', name: 'Parqueo' },
    { id: 'restaurant', name: 'Restaurante' },
    { id: 'gym', name: 'Gimnasio' },
    { id: 'spa', name: 'Spa' },
    { id: 'pets', name: 'Acepta mascotas' },
  ],
  accommodationTypes: [
    { id: 'hotel', name: 'Hotel' },
    { id: 'hostel', name: 'Hostal' },
  ],
  meals: [
    { id: 'breakfast', name: 'Desayuno' },
  ],
  stars: [3, 4, 5],
};

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

const ROUTES = {
  '/api/v1/search/properties': (res) => {
    const body = JSON.stringify({
      results: ACCOMMODATIONS,
      total: ACCOMMODATIONS.length,
      page: 1,
      totalPages: 1,
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(body);
  },
  '/api/v1/search/filters': (res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(FILTERS));
  },
};

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = (req.url || '').split('?')[0];
  const handler = ROUTES[pathname];

  if (handler) {
    handler(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path: pathname }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mock-server] Listening on 0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT',  () => { server.close(); process.exit(0); });
