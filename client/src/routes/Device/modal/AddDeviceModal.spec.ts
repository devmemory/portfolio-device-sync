import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddDeviceModal from "./AddDeviceModal";

const controller = vi.fn();

vi.mock("src/components/Modal", () => ({
  Modal: ({ children, title }: { children: React.ReactNode; title: string }) =>
    React.createElement("section", null, React.createElement("h2", null, title), children),
}));

vi.mock("./useAddDeviceController", () => ({
  default: () => controller(),
}));

describe("AddDeviceModal", () => {
  beforeEach(() => {
    controller.mockReturnValue({
      deviceModel: { description: "Desk", name: "Sensor", token: "pair-token" },
      isPending: false,
      onChangeDeviceInfo: vi.fn(),
      onSubmitPair: vi.fn(),
    });
  });

  it("renders pair form with token", () => {
    const html = renderToStaticMarkup(
      React.createElement(AddDeviceModal, {
        onClosePairModal: vi.fn(),
        onPairSuccess: vi.fn(),
      }),
    );

    expect(html).toContain("Configure device");
    expect(html).toContain("Device name");
    expect(html).toContain("pair-token");
    expect(html).toContain("Connect / Pair");
  });

  it("renders pending state", () => {
    controller.mockReturnValueOnce({
      deviceModel: { description: "", name: "", token: undefined },
      isPending: true,
      onChangeDeviceInfo: vi.fn(),
      onSubmitPair: vi.fn(),
    });

    const html = renderToStaticMarkup(
      React.createElement(AddDeviceModal, {
        onClosePairModal: vi.fn(),
        onPairSuccess: vi.fn(),
      }),
    );

    expect(html).toContain("Connect to request a token");
    expect(html).toContain("Pairing...");
  });
});
