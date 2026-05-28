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
  apiManager: { userApi: { register: vi.fn() } },
}));

vi.mock("src/utils/popupUtil", () => ({
  popupEventBus: { emit: mocks.emit },
}));

describe("useRegisterController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("emits a validation failure for incomplete fields", async () => {
    vi.spyOn(React, "useState")
      .mockReturnValueOnce([{ email: "", name: "", pw: "" }, vi.fn()])
      .mockReturnValueOnce(["", vi.fn()]);
    const { default: useRegisterController } = await import("./useRegisterController");
    const controller = useRegisterController();

    controller.onSubmit({ preventDefault: vi.fn() } as unknown as React.SubmitEvent);

    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(mocks.emit).toHaveBeenCalledWith("Complete all fields");
  });

  it("emits a validation failure when passwords do not match", async () => {
    vi.spyOn(React, "useState")
      .mockReturnValueOnce([{ email: "a@test.com", name: "Admin", pw: "password" }, vi.fn()])
      .mockReturnValueOnce(["different", vi.fn()]);
    const { default: useRegisterController } = await import("./useRegisterController");
    const controller = useRegisterController();

    controller.onSubmit({ preventDefault: vi.fn() } as unknown as React.SubmitEvent);

    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(mocks.emit).toHaveBeenCalledWith("Passwords do not match");
  });

  it("submits valid registration and handles success navigation", async () => {
    const authModel = { email: "a@test.com", name: "Admin", pw: "password" };
    vi.spyOn(React, "useState")
      .mockReturnValueOnce([authModel, vi.fn()])
      .mockReturnValueOnce(["password", vi.fn()]);
    const { default: useRegisterController } = await import("./useRegisterController");
    const controller = useRegisterController();

    controller.onSubmit({ preventDefault: vi.fn() } as unknown as React.SubmitEvent);
    mocks.mutationOptions?.onSuccess();

    expect(mocks.mutate).toHaveBeenCalledWith(authModel);
    expect(mocks.emit).toHaveBeenCalledWith("Successfully registered");
    expect(mocks.navigate).toHaveBeenCalledWith("/device");
  });
});
