import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Input } from ".";

describe("Input", () => {
  it("renders label, input value, and helper text", () => {
    const html = renderToStaticMarkup(
      React.createElement(Input, {
        helperText: "Required field",
        label: "Email",
        name: "email",
        value: "test@example.com",
        readOnly: true,
      }),
    );

    expect(html).toContain("Email");
    expect(html).toContain('id="email"');
    expect(html).toContain('value="test@example.com"');
    expect(html).toContain("Required field");
  });

  it("renders without optional label and helper text", () => {
    const html = renderToStaticMarkup(
      React.createElement(Input, { id: "plain", placeholder: "Plain input" }),
    );

    expect(html).toContain('id="plain"');
    expect(html).toContain('placeholder="Plain input"');
    expect(html).not.toContain("<span>");
  });
});
