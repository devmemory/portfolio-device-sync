import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ConnectionCard from "./ConnectionCard";

describe("ConnectionCard", () => {
  it("renders enabled connection controls", () => {
    const html = renderToStaticMarkup(
      React.createElement(ConnectionCard, { isPending: false, onConnect: () => undefined }),
    );

    expect(html).toContain("Pair and control AMQP devices");
    expect(html).toContain("Connect");
    expect(html).not.toContain("<button disabled");
  });

  it("disables connect while pending", () => {
    const html = renderToStaticMarkup(
      React.createElement(ConnectionCard, { isPending: true, onConnect: () => undefined }),
    );

    expect(html).toContain("disabled");
  });
});
