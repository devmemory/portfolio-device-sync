import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MarkdownContent from "./MarkdownContent";

describe("MarkdownContent", () => {
  it("renders common Markdown formatting", () => {
    const html = renderToStaticMarkup(
      React.createElement(MarkdownContent, {
        content: "**Strong**\n\n- first\n- second\n\n~~removed~~",
      }),
    );

    expect(html).toContain("<strong>Strong</strong>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>first</li>");
    expect(html).toContain("<del>removed</del>");
  });

  it("does not render raw HTML from conversation content", () => {
    const html = renderToStaticMarkup(
      React.createElement(MarkdownContent, {
        content: '<script>alert("no")</script>',
      }),
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
