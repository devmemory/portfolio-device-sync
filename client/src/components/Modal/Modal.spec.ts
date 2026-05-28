import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Modal } from ".";

vi.mock("src/components/Modal/ModalPortal", () => ({
  ModalPortal: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "modal" }, children),
}));

describe("Modal", () => {
  it("renders title, description, children, and close action when open", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Modal,
        {
          children: React.createElement("p", null, "Modal body"),
          description: "Configure before pairing",
          isOpen: true,
          onClose: () => undefined,
          title: "Configure device",
        },
      ),
    );

    expect(html).toContain("Configure device");
    expect(html).toContain("Configure before pairing");
    expect(html).toContain("Modal body");
    expect(html).toContain('aria-label="Close modal"');
  });

  it("renders nothing when closed", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Modal,
        {
          children: React.createElement("p", null, "Hidden"),
          isOpen: false,
          onClose: () => undefined,
          title: "Closed",
        },
      ),
    );

    expect(html).toBe("");
  });
});
