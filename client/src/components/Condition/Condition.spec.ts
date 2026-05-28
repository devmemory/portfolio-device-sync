import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Show, Switch } from ".";

describe("Condition components", () => {
  it("renders children when Show condition is true", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Show,
        { children: React.createElement("span", null, "Visible"), when: true },
      ),
    );

    expect(html).toContain("Visible");
  });

  it("does not render children when Show condition is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Show,
        { children: React.createElement("span", null, "Hidden"), when: false },
      ),
    );

    expect(html).toBe("");
  });

  it("renders the selected Switch branch", () => {
    const html = renderToStaticMarkup(
      React.createElement(Switch, {
        connected: React.createElement("span", null, "Online"),
        disconnected: React.createElement("span", null, "Offline"),
        when: "connected",
      }),
    );

    expect(html).toContain("Online");
    expect(html).not.toContain("Offline");
  });
});
