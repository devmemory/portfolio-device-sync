import { beforeEach, describe, expect, it, vi } from "vitest";
import { SERVICE_NAME } from "src/constants";

const mocks = vi.hoisted(() => ({
  emit: vi.fn(),
  mutateAsync: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({
    isPending: false,
    mutateAsync: mocks.mutateAsync,
  }),
}));

vi.mock("src/services/ApiManager", () => ({
  apiManager: { deviceApi: { sendMsg: vi.fn() } },
}));

vi.mock("src/utils/popupUtil", () => ({
  popupEventBus: { emit: mocks.emit },
}));

vi.mock("src/utils/routeUtil", () => ({
  routeName: { connection: "/connection" },
}));

describe("useConnectionController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates to the connection page when the media service exists", async () => {
    mocks.mutateAsync.mockResolvedValueOnce(true);
    const { default: useConnectionController } = await import(
      "./useConnectionController"
    );
    const controller = useConnectionController();

    await controller.onConnectDevice(7, SERVICE_NAME.MEDIA);

    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      deviceId: 7,
      message: {
        data: SERVICE_NAME.MEDIA,
        type: "CHECK",
      },
    });
    expect(mocks.navigate).toHaveBeenCalledWith("/connection/7");
  });

  it("emits a message when the requested service does not exist", async () => {
    mocks.mutateAsync.mockResolvedValueOnce(false);
    const { default: useConnectionController } = await import(
      "./useConnectionController"
    );
    const controller = useConnectionController();

    await controller.onConnectDevice(7, SERVICE_NAME.MEDIA);

    expect(mocks.emit).toHaveBeenCalledWith(
      "[MEDIA] doesn't exist on your device.",
    );
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
