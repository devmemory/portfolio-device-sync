import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeviceError from ".";

let queryState = {
  data: {
    list: [{ code: 1000, createdAt: new Date("2026-01-01T00:00:00Z"), message: "Boom" }],
    total: 1,
  },
  isFetching: false,
};

vi.mock("react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement("a", { href: to }, children),
  useParams: () => ({ id: "3" }),
}));

vi.mock("src/utils/routeUtil", () => ({
  routeName: { device: "/device" },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => queryState,
}));

vi.mock("src/hooks", () => ({
  usePagination: () => ({
    onChangePage: vi.fn(),
    onSetTotal: vi.fn(),
    pageModel: { lastPage: 1, limit: 10, page: 1 },
  }),
}));

vi.mock("src/services/ApiManager", () => ({
  apiManager: { deviceApi: { getErrors: vi.fn() } },
}));

describe("DeviceError page", () => {
  beforeEach(() => {
    queryState = {
      data: {
        list: [{ code: 1000, createdAt: new Date("2026-01-01T00:00:00Z"), message: "Boom" }],
        total: 1,
      },
      isFetching: false,
    };
  });

  it("renders device error rows", () => {
    const html = renderToStaticMarkup(React.createElement(DeviceError));

    expect(html).toContain("Device #3");
    expect(html).toContain("Error history");
    expect(html).toContain("Boom");
  });

  it("renders the empty error state", () => {
    queryState = { data: { list: [], total: 0 }, isFetching: false };

    const html = renderToStaticMarkup(React.createElement(DeviceError));

    expect(html).toContain("No errors have been reported for this device.");
  });
});
