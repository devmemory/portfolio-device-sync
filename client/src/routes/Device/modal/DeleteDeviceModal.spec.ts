import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeleteDeviceModal from "./DeleteDeviceModal";

let mutationOptions: { onSuccess: (value: boolean) => void };
const mutate = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { onSuccess: (value: boolean) => void }) => {
    mutationOptions = options;
    return { isPending: false, mutate };
  },
}));

vi.mock("src/components/Modal", () => ({
  Modal: ({ children, title }: { children: React.ReactNode; title: string }) =>
    React.createElement("section", null, React.createElement("h2", null, title), children),
}));

vi.mock("src/services/ApiManager", () => ({
  apiManager: { deviceApi: { removeDevice: vi.fn() } },
}));

describe("DeleteDeviceModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders delete confirmation UI", () => {
    const html = renderToStaticMarkup(
      React.createElement(DeleteDeviceModal, {
        deviceId: 1,
        onCancelRemove: vi.fn(),
        onConfirmRemove: vi.fn(),
      }),
    );

    expect(html).toContain("Delete device");
    expect(html).toContain("Are you sure");
    expect(html).toContain("Delete");
  });

  it("wires mutation success to confirmation callback", () => {
    const onConfirmRemove = vi.fn();
    renderToStaticMarkup(
      React.createElement(DeleteDeviceModal, {
        deviceId: 1,
        onCancelRemove: vi.fn(),
        onConfirmRemove,
      }),
    );

    mutationOptions.onSuccess(true);

    expect(onConfirmRemove).toHaveBeenCalledWith(true);
  });
});
