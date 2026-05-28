import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Table } from ".";

describe("Table", () => {
  it("renders table headers and rows", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Table,
        null,
        React.createElement(Table.Head, { list: ["id", "name"] }),
        React.createElement(
          Table.Body,
          null,
          React.createElement(
            Table.Row,
            null,
            React.createElement(Table.Td, { label: "id", children: "#1" }),
            React.createElement(Table.Td, { label: "name", children: "Sensor" }),
          ),
        ),
      ),
    );

    expect(html).toContain("<table");
    expect(html).toContain('data-label="id"');
    expect(html).toContain("id");
    expect(html).toContain("Sensor");
  });

  it("applies td class overrides", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Table,
        null,
        React.createElement(
          Table.Body,
          null,
          React.createElement(
            Table.Row,
            null,
            React.createElement(Table.Td, { children: "Empty", className: "text-center" }),
          ),
        ),
      ),
    );

    expect(html).toContain("text-center");
    expect(html).toContain("Empty");
  });
});
