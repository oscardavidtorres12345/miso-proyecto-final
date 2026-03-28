const esCO = {
  header: {
    login: "Login",
    myBookings: "Mis reservas",
    selectCountry: "Seleccionar país",
    countries: {
      co: "Colombia",
      ar: "Argentina",
      us: "Estados Unidos",
    },
  },
  footer: {
    madeWithLove: "Hecho con amor 💚",
  },
  hero: {
    subtitle: "Descubre tus próximas vacaciones",
    title: "La vida es corta y el mundo es grande.",
    search: "Buscar",
  },
  features: {
    secureBookings: {
      title: "Reservas seguras",
      description:
        "Reserva con total confianza. Tus pagos y datos están protegidos en todo momento.",
    },
    bestPrices: {
      title: "Mejores precios",
      description:
        "Comparamos tarifas para que siempre encuentres la mejor opción disponible.",
    },
    flexibleCancellation: {
      title: "Cancelación flexible",
      description:
        "Cambia de planes sin estrés. Muchas propiedades permiten cancelación con reembolso.",
    },
    payCurrency: {
      title: "Paga en pesos colombianos",
      description:
        "Ve los precios en COP, sin sorpresas al finalizar tu reserva.",
    },
  },
  search: {
    destination: "Destino",
    wherePlaceholder: "¿Adónde vas?",
    dates: "Fechas",
    addDates: "Agrega fechas",
    who: "Quién",
    howManyPlaceholder: "¿Cuántos?",
    search: "Buscar",
  },
  guests: {
    adults: "Adultos",
    adultsAge: "Edad: 13 años o más",
    children: "Niños",
    childrenAge: "Edad: 0 a 12 años",
    rooms: "Habitaciones",
    pets: "Mascotas",
    guest_one: "{{count}} huésped",
    guest_other: "{{count}} huéspedes",
  },
  notFound: {
    code: "404",
    title: "Página no encontrada",
    description: "La página que buscas no existe o fue movida.",
    goHome: "Volver al inicio",
  },
  cart: {
    title: "Carrito",
    removeItem: "Quitar del carrito",
    mobileBar: {
      openSummary: "Ver resumen del pedido",
    },
    summaryTitle: "Resumen del pedido",
    summary: {
      total: "TOTAL",
      pay: "Pagar",
      lines: {
        productName: "{{name}}",
        productsCount: "Productos ({{count}})",
        charges: "Cargos",
        taxes: "Impuestos",
        insurance: "Seguro",
        discounts: "Descuentos",
      },
    },
  },
  validation: {
    required: "Este campo es obligatorio",
    emailInvalid: "Ingresa un correo electrónico válido",
    passwordMinLength: "La contraseña debe tener al menos 8 caracteres",
    passwordMismatch: "Las contraseñas no coinciden",
    termsRequired: "Debes aceptar los términos y condiciones",
  },
  login: {
    title: "Inicia sesión en tu cuenta",
    noAccount: "¿No tienes cuenta?",
    register: "Regístrate",
    email: "Correo",
    emailPlaceholder: "email@mail.com",
    password: "Contraseña",
    submit: "Login",
  },
  signup: {
    title: "Crea una cuenta",
    firstName: "Nombres",
    firstNamePlaceholder: "Jhon",
    lastName: "Apellidos",
    lastNamePlaceholder: "Doe",
    email: "Correo",
    emailPlaceholder: "email@mail.com",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    submit: "Crear cuenta",
    alreadyAccount: "¿Ya tienes cuenta?",
    login: "Inicia sesión",
    terms: "Acepto los",
    termsLink: "términos y condiciones de tratamiento de datos personales",
  },
  subview: {
    cancel: "Cancelar",
    apply: "Aplicar",
  },
  travel: {
    label: "Punto de viaje",
    heading: "Te ayudamos a encontrar las vacaciones de tus sueños",
    description:
      "Te acompañamos en cada paso de tu aventura, desde la búsqueda del destino perfecto hasta la reserva de tu alojamiento ideal. Con miles de opciones disponibles alrededor del mundo, encontrarás el lugar que se adapta a tu estilo de vida, tu presupuesto y todo lo que siempre has soñado vivir. Descubre nuevos horizontes con la tranquilidad de saber que cada detalle está en buenas manos.",
    mountainAlt: "Aventura en montaña",
    seaAlt: "Destino de mar",
  },
  destinations: {
    label: "Destinos populares",
    heading: "Descubre destinos populares",
  },
  price: {
    title: "Precio",
    min: "Mín.",
    max: "Máx.",
  },
  searchFilter: {
    title: "Alojamientos",
  },
  accommodationCard: {
    breakfast: "Desayuno",
    breakfastAlt: "Desayuno incluido",
    distanceFromCenter: "a {{distance}} km del centro",
    reviews_one: "{{count}} comentario",
    reviews_other: "{{count}} comentarios",
    nightsAdults: "{{nights}} noches, {{adults}} adultos",
    includesTaxes: "Incluye impuestos y cargos",
    viewDetails: "Ver detalles",
    rating: {
      excellent: "Excelente",
      veryGood: "Muy bien",
      good: "Bueno",
      fair: "Regular",
      acceptable: "Aceptable",
    },
  },
  searchResults: {
    services: "Servicios",
    accommodationType: "Tipo de alojamiento",
    meals: "Alimentación",
    stars: "Estrellas",
    filter: "Filtrar",
    clearFilters: "Limpiar filtros",
    searchInFilter: "Busca por {{title}}",
    showMore: "Ver más",
    showLess: "Ver menos",
    editSearch: "Editar búsqueda",
    accommodation: {
      hotel: "Hoteles",
      house: "Casas",
      cabin: "Cabañas",
      hostel: "Hostales",
      villa: "Villas",
      resort: "Resorts",
    },
    service: {
      parking: "Estacionamiento",
      pool: "Piscina",
      pets: "Acepta mascotas",
      kids: "Servicios para niños",
      bathtub: "Bañera",
      restaurant: "Restaurante",
      spa: "Spa",
      gym: "Gimnasio",
      wifi: "WiFi gratuito",
      ac: "Aire acondicionado",
    },
    meal: {
      breakfast: "Desayuno",
      buffet: "Desayuno buffet",
      allinclusive: "Todo incluido",
    },
  },
} as const;

export default esCO;
