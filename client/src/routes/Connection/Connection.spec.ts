import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONNECTION_STATE } from "src/constants";
import Connection from ".";

const controller = vi.fn();

vi.mock("src/utils/routeUtil", () => ({
  routeName: { device: "/device" },
}));

vi.mock("react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement("a", { href: to }, children),
}));

vi.mock("./useConnectionController", () => ({
  default: () => controller(),
}));

describe("Connection page", () => {
  beforeEach(() => {
    controller.mockReturnValue({
      id: "7",
      connection: CONNECTION_STATE.offline,
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      videoRef: { current: null },
    });
  });

  it("renders disconnected stream state", () => {
    const html = renderToStaticMarkup(React.createElement(Connection));

    expect(html).toContain("Device #7 video session");
    expect(html).toContain("Disconnected");
    expect(html).toContain("Stream is offline");
    expect(html).toContain("Device offline");
  });

  it("renders connected stream controls", () => {
    controller.mockReturnValueOnce({
      id: "7",
      connection: CONNECTION_STATE.connected,
      onConnect: vi.fn(),
      onDisconnect: vi.fn(),
      videoRef: { current: null },
    });

    const html = renderToStaticMarkup(React.createElement(Connection));

    expect(html).toContain("Connected");
    expect(html).toContain("Online");
    expect(html).toContain("Disconnect stream");
    expect(html).not.toContain("Stream is offline");
  });
});
