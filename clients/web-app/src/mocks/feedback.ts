export type FeedbackMockItem = {
  id: string;
  userName: string;
  title: string;
  rating: number;
  comment: string;
};

export const mockFeedback: FeedbackMockItem[] = [
  {
    id: "feedback-1",
    userName: "Ana Torres",
    title: "Ubicación excelente y servicio rápido",
    rating: 4,
    comment:
      "La experiencia fue muy buena. El equipo fue muy amable y el proceso de check-in salió sin demoras.",
  },
  {
    id: "feedback-2",
    userName: "Carlos Ruiz",
    title: "Habitación cómoda y limpia",
    rating: 5,
    comment:
      "Todo estaba en perfecto estado, muy buena limpieza y excelente atención. Volvería a reservar aquí.",
  },
  {
    id: "feedback-3",
    userName: "Laura Gómez",
    title: "Buena estadía con detalles por mejorar",
    rating: 3,
    comment:
      "La estadía fue agradable, aunque el WiFi tuvo intermitencias. El personal respondió bien a las solicitudes.",
  },
];
