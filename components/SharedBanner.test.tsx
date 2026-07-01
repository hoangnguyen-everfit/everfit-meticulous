import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SharedBanner from "./SharedBanner";

describe("SharedBanner", () => {
  it("renders a greeting banner", () => {
    render(<SharedBanner />);
    const banner = screen.getByTestId("banner-shared");
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toMatch(/Good (morning|afternoon|evening) — welcome to Everfit/);
  });
});
