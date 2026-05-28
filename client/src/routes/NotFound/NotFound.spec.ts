import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import NotFound from ".";

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("src/utils/routeUtil", () => ({
  routeName: { main: "/" },
}));

describe("NotFound page", () => {
  it("renders the 404 state", () => {
    const html = renderToStaticMarkup(React.createElement(NotFound));

    expect(html).toContain("404");
    expect(html).toContain("Page not found");
    expect(html).toContain("Go home");
  });
});
