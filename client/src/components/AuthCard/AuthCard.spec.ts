import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AuthCard } from ".";

describe("AuthCard", () => {
  it("renders Header and Body subcomponents", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        AuthCard,
        null,
        React.createElement(AuthCard.Header, null, React.createElement("h1", null, "Login")),
        React.createElement(AuthCard.Body, null, React.createElement("form", null, "Fields")),
      ),
    );

    expect(html).toContain("Login");
    expect(html).toContain("Fields");
  });

  it("ignores unrelated children", () => {
    const html = renderToStaticMarkup(
      React.createElement(AuthCard, null, React.createElement("p", null, "Loose child")),
    );

    expect(html).not.toContain("Loose child");
  });
});
