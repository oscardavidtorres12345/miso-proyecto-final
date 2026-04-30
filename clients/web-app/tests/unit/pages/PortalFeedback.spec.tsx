import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PortalFeedback from "@/pages/PortalFeedback";
import { mockFeedback } from "@/mocks/feedback";

describe("PortalFeedback", () => {
  it("renderiza el titulo de la pagina", () => {
    render(<PortalFeedback />);
    expect(screen.getByRole("heading", { name: "Feedback" })).toBeInTheDocument();
  });

  it("renderiza una card por cada item del mock", () => {
    render(<PortalFeedback />);

    const ratings = screen.getAllByLabelText(/Rating \d de 5/);
    expect(ratings).toHaveLength(mockFeedback.length);
    expect(screen.getByText(mockFeedback[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockFeedback[1].comment)).toBeInTheDocument();
  });
});
