import type { ReservationCardData } from "@/components/ReservationCard";

export const mockCurrentReservations: ReservationCardData[] = [
  {
    id: "res-1",
    imageUrl: "https://picsum.photos/seed/aonang-resort/640/400",
    accommodationName: "Aonang Villa Resort",
    location: "Cartagena de Indias",
    arrival: new Date(2026, 1, 21),
    departure: new Date(2026, 2, 16),
    guestCount: 2,
    showCancel: true,
  },
  {
    id: "res-2",
    imageUrl: "https://picsum.photos/seed/caribbean-suite/640/400",
    accommodationName: "Suite Bocagrande Vista Mar",
    location: "Cartagena de Indias",
    arrival: new Date(2026, 4, 3),
    departure: new Date(2026, 4, 10),
    guestCount: 4,
    showCancel: true,
  },
];

export const mockPastReservations: ReservationCardData[] = [
  {
    id: "past-1",
    imageUrl: "https://picsum.photos/seed/past-san-andres/640/400",
    accommodationName: "Aonang Villa Resort",
    location: "Cartagena, Colombia",
    arrival: new Date(2025, 6, 12),
    departure: new Date(2025, 6, 19),
    guestCount: 2,
    showCancel: false,
  },
  {
    id: "past-2",
    imageUrl: "https://picsum.photos/seed/past-bocagrande/640/400",
    accommodationName: "Hotel Bocagrande Plaza",
    location: "Cartagena, Colombia",
    arrival: new Date(2025, 3, 3),
    departure: new Date(2025, 3, 8),
    guestCount: 1,
    showCancel: false,
  },
  {
    id: "past-3",
    imageUrl: "https://picsum.photos/seed/past-santa-marta/640/400",
    accommodationName: "Marina Santa Marta Suites",
    location: "Santa Marta, Colombia",
    arrival: new Date(2024, 11, 21),
    departure: new Date(2024, 11, 28),
    guestCount: 3,
    showCancel: false,
  },
];
