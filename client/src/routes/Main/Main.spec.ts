import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Main from ".";

vi.mock("react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement("a", { href: to }, children),
}));

vi.mock("src/utils/routeUtil", () => ({
  routeName: { device: "/device", login: "/auth/login" },
}));

vi.mock("src/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("src/utils")>();
  return { ...actual, authUtil: { isLoggedIn: false } };
});

describe("Main page", () => {
  it("renders the AMQP console landing content", () => {
    const html = renderToStaticMarkup(React.createElement(Main));

    expect(html).toContain("AMQP device console");
    expect(html).toContain("Open devices");
    expect(html).toContain("Sign in");
  });

  it("renders workflow cards", () => {
    const html = renderToStaticMarkup(React.createElement(Main));

    expect(html).toContain("Connect, pair, and test local devices");
    expect(html).toContain("1");
    expect(html).toContain("2");
    expect(html).toContain("3");
  });
});
