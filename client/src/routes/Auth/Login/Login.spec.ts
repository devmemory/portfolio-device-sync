import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from ".";

const controller = vi.fn();

vi.mock("src/utils/routeUtil", () => ({
  routeName: { register: "/auth/register" },
}));

vi.mock("react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement("a", { href: to }, children),
}));

vi.mock("./useLoginController", () => ({
  default: () => controller(),
}));

describe("Login page", () => {
  beforeEach(() => {
    controller.mockReturnValue({
      authModel: { email: "admin@example.com", pw: "password" },
      onChange: vi.fn(),
      onSubmit: vi.fn(),
    });
  });

  it("renders login form fields and submit button", () => {
    const html = renderToStaticMarkup(React.createElement(Login));

    expect(html).toContain("Login");
    expect(html).toContain("Email");
    expect(html).toContain("Password");
    expect(html).toContain("Create one");
  });

  it("renders empty form state without crashing", () => {
    controller.mockReturnValueOnce({
      authModel: { email: "", pw: "" },
      onChange: vi.fn(),
      onSubmit: vi.fn(),
    });

    const html = renderToStaticMarkup(React.createElement(Login));

    expect(html).toContain('value=""');
    expect(html).toContain("Enter your password");
  });
});
