import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from ".";

describe("Button", () => {
  it("renders a primary button with button type by default", () => {
    const html = renderToStaticMarkup(React.createElement(Button, null, "Save"));

    expect(html).toContain('type="button"');
    expect(html).toContain("Save");
    expect(html).toContain("bg-primary-600");
  });

  it("renders a disabled danger button", () => {
    const html = renderToStaticMarkup(
      React.createElement(Button, { disabled: true, variant: "danger" }, "Delete"),
    );

    expect(html).toContain("disabled");
    expect(html).toContain("Delete");
    expect(html).toContain("text-rose-700");
  });
});
