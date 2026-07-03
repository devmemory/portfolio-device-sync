import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeviceList from ".";

const controller = vi.fn();
const connectionController = vi.fn();

vi.mock("src/utils/routeUtil", () => ({
  routeName: { deviceError: "/device/error" },
}));

vi.mock("react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement("a", { href: to }, children),
  useNavigate: () => vi.fn(),
}));

vi.mock("./useDeviceController", () => ({
  default: () => controller(),
}));

vi.mock("./useConnectionController", () => ({
  default: () => connectionController(),
}));

vi.mock("./modal/AddDeviceModal", () => ({
  default: () => React.createElement("div", null, "Add device modal"),
}));

vi.mock("./modal/DeleteDeviceModal", () => ({
  default: () => React.createElement("div", null, "Delete device modal"),
}));

describe("DeviceList page", () => {
  beforeEach(() => {
    connectionController.mockReturnValue({
      isPendingConnection: false,
      onConnectDevice: vi.fn(),
    });

    controller.mockReturnValue({
      data: {
        list: [{ description: "Temperature sensor", id: 1, name: "Sensor" }],
        total: 1,
      },
      isCheckPending: false,
      isPairModalOpen: false,
      isRemoveModalOpen: false,
      onCancelRemove: vi.fn(),
      onChangePage: vi.fn(),
      onClosePairModal: vi.fn(),
      onConfirmRemove: vi.fn(),
      onConnectionCheck: vi.fn(),
      onOpenRemove: vi.fn(),
      onPairSuccess: vi.fn(),
      pageModel: { lastPage: 1, limit: 10, page: 1 },
      selectedDeviceId: null,
    });
  });

  it("renders registered devices from controller data", () => {
    const html = renderToStaticMarkup(React.createElement(DeviceList));

    expect(html).toContain("Registered devices");
    expect(html).toContain("1 devices found");
    expect(html).toContain("Sensor");
    expect(html).toContain("Temperature sensor");
  });

  it("renders pair and delete modal states", () => {
    controller.mockReturnValueOnce({
      ...controller(),
      isPairModalOpen: true,
      isRemoveModalOpen: true,
      selectedDeviceId: 1,
    });

    const html = renderToStaticMarkup(React.createElement(DeviceList));

    expect(html).toContain("Add device modal");
    expect(html).toContain("Delete device modal");
  });
});
