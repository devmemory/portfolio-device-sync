import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emit: vi.fn(),
  model: { description: "", name: "", token: undefined as string | undefined },
  mutations: [] as Array<{ onSuccess: (value: string | boolean) => void }>,
  startPair: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: (fn: () => void) => fn(),
    useState: () => [mocks.model, vi.fn()] as const,
  };
});

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { onSuccess: (value: string | boolean) => void }) => {
    mocks.mutations.push(options);
    return { isPending: false, mutate: mocks.mutations.length === 1 ? vi.fn() : mocks.startPair };
  },
}));

vi.mock("src/services/ApiManager", () => ({
  apiManager: {
    deviceApi: { getPairToken: vi.fn() },
    localApi: { startPair: vi.fn() },
  },
}));

vi.mock("src/utils/popupUtil", () => ({
  popupEventBus: { emit: mocks.emit },
}));

describe("useAddDeviceController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.model = { description: "", name: "", token: undefined };
    mocks.mutations = [];
  });

  it("emits failure when pair token is missing", async () => {
    const { default: useAddDeviceController } = await import("./useAddDeviceController");
    const controller = useAddDeviceController({ onPairSuccess: vi.fn() });

    controller.onSubmitPair({ preventDefault: vi.fn() } as unknown as React.SubmitEvent);

    expect(mocks.startPair).not.toHaveBeenCalled();
    expect(mocks.emit).toHaveBeenCalledWith("Connect to request a pair token");
  });

  it("submits pair data when token and name are valid", async () => {
    mocks.model = { description: " Desk ", name: " Sensor ", token: "token" };
    const { default: useAddDeviceController } = await import("./useAddDeviceController");
    const controller = useAddDeviceController({ onPairSuccess: vi.fn() });

    controller.onSubmitPair({ preventDefault: vi.fn() } as unknown as React.SubmitEvent);

    expect(mocks.startPair).toHaveBeenCalledWith({
      description: "Desk",
      name: "Sensor",
      token: "token",
    });
  });
});
