import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  emit: vi.fn(),
  mutate: vi.fn(),
  navigate: vi.fn(),
  mutationOptions: undefined as undefined | { onSuccess: () => void },
}));

vi.mock("src/utils/routeUtil", () => ({
  routeName: { device: "/device" },
}));

vi.mock("react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { onSuccess: () => void }) => {
    mocks.mutationOptions = options;
    return { mutate: mocks.mutate };
  },
}));

vi.mock("src/services/ApiManager", () => ({
  apiManager: { userApi: { login: vi.fn() } },
}));

vi.mock("src/utils/popupUtil", () => ({
  popupEventBus: { emit: mocks.emit },
}));

describe("useLoginController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("emits a validation failure when credentials are missing", async () => {
    vi.spyOn(React, "useState").mockReturnValue([{ email: "", pw: "" }, vi.fn()]);
    const { default: useLoginController } = await import("./useLoginController");
    const controller = useLoginController();

    controller.onSubmit({ preventDefault: vi.fn() } as unknown as React.SubmitEvent);

    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(mocks.emit).toHaveBeenCalledWith("Enter email and password");
  });

  it("submits credentials and handles success navigation", async () => {
    const authModel = { email: "admin@example.com", pw: "password" };
    vi.spyOn(React, "useState").mockReturnValue([authModel, vi.fn()]);
    const { default: useLoginController } = await import("./useLoginController");
    const controller = useLoginController();

    controller.onSubmit({ preventDefault: vi.fn() } as unknown as React.SubmitEvent);
    mocks.mutationOptions?.onSuccess();

    expect(mocks.mutate).toHaveBeenCalledWith(authModel);
    expect(mocks.emit).toHaveBeenCalledWith("Successfully logged in");
    expect(mocks.navigate).toHaveBeenCalledWith("/device");
  });
});
