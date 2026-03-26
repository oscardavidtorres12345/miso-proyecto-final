const es = {
  header: {
    login: 'Login',
    myBookings: 'Mis reservas',
    selectCountry: 'Seleccionar país',
    countries: {
      co: 'Colombia',
      ar: 'Argentina',
      us: 'Estados Unidos',
    },
  },
  footer: {
    madeWithLove: 'Hecho con amor 💚',
  },
  hero: {
    subtitle: 'Descubre tus proximas vacaciones',
    title: 'La vida es corta y el mundo es grande.',
    search: 'Buscar',
  },
  features: {
    secureBookings: {
      title: 'Reservas seguras',
      description: 'Reserva con total confianza. Tus pagos y datos están protegidos en todo momento.',
    },
    bestPrices: {
      title: 'Mejores precios',
      description: 'Comparamos tarifas para que siempre encuentres la mejor opción disponible.',
    },
    flexibleCancellation: {
      title: 'Cancelación flexible',
      description: 'Cambia de planes sin estrés. Muchas propiedades permiten cancelación con reembolso.',
    },
    payCurrency: {
      title: 'Paga en tu moneda',
      description: 'Ve los precios en tu moneda local, sin sorpresas al finalizar.',
    },
  },
  search: {
    destination: 'Destino',
    wherePlaceholder: '¿Donde?',
    dates: 'Fechas',
    addDates: 'Agrega fechas',
    who: 'Quién',
    howManyPlaceholder: '¿Cuántos?',
    search: 'Buscar',
  },
  guests: {
    adults: 'Adultos',
    adultsAge: 'Edad: 13 años o más',
    children: 'Niños',
    childrenAge: 'Edad: 0 a 12 años',
    rooms: 'Habitaciones',
    pets: 'Mascotas',
    guest_one: '{{count}} huésped',
    guest_other: '{{count}} huéspedes',
  },
  subview: {
    cancel: 'Cancelar',
    apply: 'Aplicar',
  },
  travel: {
    label: 'Punto de viaje',
    heading: 'Te ayudamos a encontrar las vacaciones de tus sueños',
    description: 'Te acompañamos en cada paso de tu aventura, desde la búsqueda del destino perfecto hasta la reserva de tu alojamiento ideal. Con miles de opciones disponibles alrededor del mundo, encontrarás el lugar que se adapta a tu estilo de vida, tu presupuesto y todo lo que siempre has soñado vivir. Descubre nuevos horizontes con la tranquilidad de saber que cada detalle está en buenas manos.',
    mountainAlt: 'Aventura en montaña',
    seaAlt: 'Destino de mar',
  },
  destinations: {
    label: 'Destinos populares',
    heading: 'Descubre destinos populares',
  },
  price: {
    title: 'Precio',
    min: 'Min.',
    max: 'Max.',
  },
  searchFilter: {
    title: 'Alojamientos',
  },
  searchResults: {
    services: 'Servicios',
    accommodationType: 'Tipo de alojamiento',
    meals: 'Alimentación',
    accommodation: {
      hotel: 'Hoteles',
      house: 'Casas',
      cabin: 'Cabañas',
      hostel: 'Hostales',
      villa: 'Villas',
      resort: 'Resorts',
    },
    service: {
      parking: 'Estacionamientos',
      pool: 'Piscina',
      pets: 'Acepta mascotas',
      kids: 'Servicios para niños',
      bathtub: 'Bañera',
      restaurant: 'Restaurante',
      spa: 'Spa',
      gym: 'Gimnasio',
      wifi: 'WiFi gratuito',
      ac: 'Aire acondicionado',
    },
    meal: {
      breakfast: 'Desayuno',
      buffet: 'Desayuno buffet',
      allinclusive: 'All inclusive',
    },
  },
} as const

export default es
