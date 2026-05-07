'use strict';

const http = require('http');

const PORT = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 3001;

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

const UPCOMING_BY_USER = new Map([
  ['default', [
    {
      id: 'mock-bk-up-001',
      imageUrl: 'https://picsum.photos/seed/mock-bk-up-001/640/400',
      accommodationName: 'Hotel Caribe Cartagena',
      location: 'Cartagena',
      arrival: '2026-06-20',
      departure: '2026-06-24',
      guestCount: 2,
      showCancel: true,
    },
    {
      id: 'mock-bk-up-002',
      imageUrl: 'https://picsum.photos/seed/mock-bk-up-002/640/400',
      accommodationName: 'Apartamentos Bocagrande',
      location: 'Cartagena',
      arrival: '2026-07-03',
      departure: '2026-07-05',
      guestCount: 3,
      showCancel: true,
    },
  ]],
]);

const PAST_BY_USER = new Map([
  ['default', [
    {
      id: 'mock-bk-past-001',
      imageUrl: 'https://picsum.photos/seed/mock-bk-past-001/640/400',
      accommodationName: 'Hostal El Centenario',
      location: 'Cartagena',
      arrival: '2026-03-01',
      departure: '2026-03-04',
      guestCount: 2,
      showCancel: false,
    },
  ]],
]);

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

function getUpcoming(userId) {
  return JSON.parse(JSON.stringify(UPCOMING_BY_USER.get(userId) || UPCOMING_BY_USER.get('default') || []));
}

function getPast(userId) {
  return JSON.parse(JSON.stringify(PAST_BY_USER.get(userId) || PAST_BY_USER.get('default') || []));
}

function handleDynamicRoutes(pathname, method, res) {
  const upcomingMatch = pathname.match(/^\/api\/v1\/bookings\/users\/([^/]+)\/confirmed-upcoming$/);
  if (method === 'GET' && upcomingMatch) {
    const userId = decodeURIComponent(upcomingMatch[1]);
    const reservations = getUpcoming(userId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      user_id: userId,
      reservations,
      status: 'ok',
      sprint: 3,
      hu_id: 'HU017',
    }));
    return true;
  }

  const pastMatch = pathname.match(/^\/api\/v1\/bookings\/users\/([^/]+)\/confirmed-past$/);
  if (method === 'GET' && pastMatch) {
    const userId = decodeURIComponent(pastMatch[1]);
    const reservations = getPast(userId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      user_id: userId,
      reservations,
      status: 'ok',
      sprint: 3,
      hu_id: 'HU017',
    }));
    return true;
  }

  const cancelMatch = pathname.match(/^\/api\/v1\/bookings\/([^/]+)\/user-cancel$/);
  if (method === 'DELETE' && cancelMatch) {
    const bookingId = decodeURIComponent(cancelMatch[1]);
    for (const [key, rows] of UPCOMING_BY_USER.entries()) {
      UPCOMING_BY_USER.set(key, rows.filter((r) => r.id !== bookingId));
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'CANCELLED',
      sprint: 3,
      hu_id: 'HU017',
      booking_id: bookingId,
    }));
    return true;
  }

  return false;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = (req.url || '').split('?')[0];
  const handler = ROUTES[pathname];

  if (handler) {
    handler(res);
  } else if (handleDynamicRoutes(pathname, req.method || 'GET', res)) {
    return;
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
