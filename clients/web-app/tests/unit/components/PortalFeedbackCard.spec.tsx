import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PortalFeedbackCard from "@/components/PortalFeedbackCard";

describe("PortalFeedbackCard", () => {
  it("renderiza inicial, titulo y comentario", () => {
    render(
      <PortalFeedbackCard
        userName="Ana Torres"
        title="Ubicación excelente"
        rating={4}
        comment="Muy buena atención y limpieza."
      />,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ubicación excelente" })).toBeInTheDocument();
    expect(screen.getByText("Muy buena atención y limpieza.")).toBeInTheDocument();
  });

  it("muestra correctamente el aria-label del rating", () => {
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
