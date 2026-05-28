import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Register from ".";

const controller = vi.fn();

vi.mock("src/utils/routeUtil", () => ({
  routeName: { login: "/auth/login" },
}));

vi.mock("react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
    React.createElement("a", { href: to }, children),
}));

vi.mock("./useRegisterController", () => ({
  default: () => controller(),
}));

describe("Register page", () => {
  beforeEach(() => {
    controller.mockReturnValue({
      authModel: { email: "admin@example.com", name: "Admin", pw: "password" },
      onChange: vi.fn(),
      onSubmit: vi.fn(),
      pwConfirm: "password",
      setPwConfirm: vi.fn(),
    });
  });

  it("renders registration form fields", () => {
    const html = renderToStaticMarkup(React.createElement(Register));

    expect(html).toContain("Register");
    expect(html).toContain("Name");
    expect(html).toContain("Confirm password");
    expect(html).toContain("Already registered?");
  });

  it("renders empty registration state", () => {
    controller.mockReturnValueOnce({
      authModel: { email: "", name: "", pw: "" },
      onChange: vi.fn(),
      onSubmit: vi.fn(),
      pwConfirm: "",
      setPwConfirm: vi.fn(),
    });

    const html = renderToStaticMarkup(React.createElement(Register));

    expect(html).toContain("Create a password");
    expect(html).toContain('value=""');
  });
});
