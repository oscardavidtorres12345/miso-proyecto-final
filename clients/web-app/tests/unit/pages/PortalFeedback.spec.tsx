import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/i18n";
import PortalFeedback from "@/pages/PortalFeedback";
import { mockFeedback } from "@/mocks/feedback";
import { renderWithProviders } from "../renderWithProviders";
import * as AuthContext from "@/context/AuthContext";
import * as bookingService from "@/services/bookingService";
import { UserRole } from "@/types/user";

const MOCK_REVIEWS: bookingService.ReviewItemDto[] = mockFeedback.map((item, index) => ({
  id: index + 1,
  booking_id: `bk-mock-${index}`,
  property_id: index + 1,
  room_id: index + 1,
  hotel_name: item.title,
  room_name: null,
  guest_name: item.userName,
  guest_username: null,
  guest_avatar_url: null,
  rating: item.rating,
  comment: item.comment,
  review_date: "2026-03-08T12:00:00Z",
}));

describe("PortalFeedback", () => {
  beforeEach(() => {
    i18n.changeLanguage("es-CO");

    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      session: {
        user: {
          user_id: 99,
          username: "staff",
          email: "staff@test.com",
          role: UserRole.STAFF,
          is_active: true,
        },
        permissions: [],
        sessionExpiresAt: new Date(Date.now() + 3600000).toISOString(),
        token: "mock-jwt-token",
      },
      token: "mock-jwt-token",
      isAuthenticated: true,
      autoLoggedOut: false,
      setAuthData: vi.fn(),
      clearAuthData: vi.fn(),
      clearAutoLoggedOut: vi.fn(),
    });

    vi.spyOn(bookingService, "getPortalFeedback").mockResolvedValue({
      reviews: MOCK_REVIEWS,
      status: "ok",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the page title", async () => {
    renderWithProviders(<PortalFeedback />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Feedback" })).toBeInTheDocument(),
    );
  });

  it("renders one card per review from the API", async () => {
    renderWithProviders(<PortalFeedback />);

    await waitFor(() => {
      const ratings = screen.getAllByLabelText(/Rating \d de 5/);
      expect(ratings).toHaveLength(mockFeedback.length);
    });
    expect(screen.getByText(mockFeedback[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockFeedback[1].comment)).toBeInTheDocument();
  });

  it("does not call the API or render cards when there is no session", async () => {
    vi.spyOn(AuthContext, "useAuth").mockReturnValue({
      session: null,
      token: null,
      isAuthenticated: false,
      autoLoggedOut: false,
      setAuthData: vi.fn(),
      clearAuthData: vi.fn(),
      clearAutoLoggedOut: vi.fn(),
    });

    renderWithProviders(<PortalFeedback />);

    await waitFor(() =>
      expect(bookingService.getPortalFeedback).not.toHaveBeenCalled(),
    );
    expect(screen.queryAllByLabelText(/Rating \d de 5/)).toHaveLength(0);
  });

  it("shows snackbar with message when the API rejects with an Error", async () => {
    vi.spyOn(bookingService, "getPortalFeedback").mockRejectedValueOnce(
      new Error("service unavailable"),
    );

    renderWithProviders(<PortalFeedback />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("service unavailable"),
    );
  });

  it("shows translated load error when rejection is not an Error instance", async () => {
    vi.spyOn(bookingService, "getPortalFeedback").mockRejectedValueOnce("timeout");

    renderWithProviders(<PortalFeedback />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "No se pudo cargar el feedback. Intenta de nuevo.",
      ),
    );
  });

  it("shows empty state when there are no reviews", async () => {
    vi.spyOn(bookingService, "getPortalFeedback").mockResolvedValueOnce({
      reviews: [],
      status: "ok",
    });

    renderWithProviders(<PortalFeedback />);

    await waitFor(() =>
      expect(
        screen.getByText("Aún no hay reseñas para tus propiedades."),
      ).toBeInTheDocument(),
    );
  });

  it("treats undefined reviews as an empty list", async () => {
    vi.spyOn(bookingService, "getPortalFeedback").mockResolvedValueOnce({
      reviews: undefined as unknown as bookingService.ReviewItemDto[],
      status: "ok",
    });

    renderWithProviders(<PortalFeedback />);

    await waitFor(() =>
      expect(
        screen.getByText("Aún no hay reseñas para tus propiedades."),
      ).toBeInTheDocument(),
    );
  });

  it("builds title from hotel name and trimmed room_name when present", async () => {
    vi.spyOn(bookingService, "getPortalFeedback").mockResolvedValueOnce({
      reviews: [
        {
          id: 1,
          booking_id: "bk-1",
          property_id: 1,
          room_id: 1,
          hotel_name: "Casa del Mar",
          room_name: "  Suite Junior  ",
          guest_name: "Ana",
          guest_username: null,
          guest_avatar_url: null,
          rating: 5,
          comment: "Genial",
          review_date: "2026-03-08T12:00:00Z",
        },
      ],
      status: "ok",
    });

    renderWithProviders(<PortalFeedback />);

    await waitFor(() =>
      expect(screen.getByText("Casa del Mar — Suite Junior")).toBeInTheDocument(),
    );
  });

  it("closes the error snackbar when clicking close", async () => {
    vi.spyOn(bookingService, "getPortalFeedback").mockRejectedValueOnce(new Error("failed"));

    renderWithProviders(<PortalFeedback />);

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    await waitFor(() => {
      const alert = screen.getByRole("alert", { hidden: true });
      expect(alert).toHaveAttribute("aria-hidden", "true");
    });
  });
});
