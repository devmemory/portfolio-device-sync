import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pagination } from ".";

describe("Pagination", () => {
  it("renders nothing for a single page", () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, {
        currentPage: 1,
        lastPage: 1,
        onPageChange: () => undefined,
      }),
    );

    expect(html).toBe("");
  });

  it("renders selected page and next range control", () => {
    const html = renderToStaticMarkup(
      React.createElement(Pagination, {
        currentPage: 2,
        lastPage: 12,
        onPageChange: () => undefined,
      }),
    );

    expect(html).toContain("data-selected=\"true\"");
    expect(html).toContain(">2</button>");
    expect(html).toContain("Next");
  });
});
