import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PortalFeedbackCard from "@/components/PortalFeedbackCard";

describe("PortalFeedbackCard", () => {
  it("renders initial letter, title and comment", () => {
    render(
      <PortalFeedbackCard
        userName="Ana Torres"
        title="Ubicación excelente"
        rating={4}
        comment="Muy buena atención y limpieza."
      />,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ana Torres" })).toBeInTheDocument();
    expect(screen.getByText("Ubicación excelente")).toBeInTheDocument();
    expect(screen.getByText("Muy buena atención y limpieza.")).toBeInTheDocument();
  });

  it("renders the full guest name", () => {
    render(
      <PortalFeedbackCard
        userName="Ana Torres"
        title="Ubicación excelente"
        rating={4}
        comment="Muy buena atención y limpieza."
      />,
    );

    expect(screen.getByText("Ana Torres")).toBeInTheDocument();
  });

  it("renders rating aria-label correctly", () => {
    render(
      <PortalFeedbackCard
        userName="Carlos Ruiz"
        title="Habitación cómoda"
        rating={5}
        comment="Todo perfecto."
      />,
    );

    expect(screen.getByLabelText("Rating 5 de 5")).toBeInTheDocument();
  });
});
