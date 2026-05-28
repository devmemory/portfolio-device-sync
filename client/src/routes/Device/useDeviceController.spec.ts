import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  checkDevice: vi.fn(),
  emit: vi.fn(),
  navigate: vi.fn(),
  onChangePage: vi.fn(),
  onClosePairModal: vi.fn(),
  onCloseRemoveModal: vi.fn(),
  onOpenPairModal: vi.fn(),
  onOpenRemoveModal: vi.fn(),
  onSetTotal: vi.fn(),
  refetch: vi.fn(),
  mutations: [] as Array<{ onSuccess: (value?: boolean) => void }>,
}));

vi.mock("src/utils/routeUtil", () => ({
  routeName: { connection: "/connection" },
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: (fn: () => void) => fn(),
    useState: <T,>(initial: T) => [initial, vi.fn()] as const,
  };
});

vi.mock("react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { onSuccess: (value?: boolean) => void }) => {
    mocks.mutations.push(options);
    return { isPending: false, mutate: mocks.checkDevice };
  },
  useQuery: () => ({
    data: { list: [{ id: 1, name: "Sensor" }], total: 20 },
    refetch: mocks.refetch,
  }),
}));

vi.mock("src/hooks", () => ({
  useDisclosure: vi.fn()
    .mockReturnValueOnce({
      isOpen: false,
      onClose: mocks.onClosePairModal,
      onOpen: mocks.onOpenPairModal,
    })
    .mockReturnValue({
      isOpen: false,
      onClose: mocks.onCloseRemoveModal,
      onOpen: mocks.onOpenRemoveModal,
    }),
  usePagination: () => ({
    onChangePage: mocks.onChangePage,
    onSetTotal: mocks.onSetTotal,
    pageModel: { lastPage: 1, limit: 10, page: 1 },
  }),
}));

vi.mock("src/services/ApiManager", () => ({
  apiManager: { deviceApi: { getList: vi.fn() }, localApi: { checkDevice: vi.fn() } },
}));

vi.mock("src/utils/popupUtil", () => ({
  popupEventBus: { emit: mocks.emit },
}));

describe("useDeviceController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutations = [];
  });

  it("opens the pair modal when local device check succeeds", async () => {
    const { default: useDeviceController } = await import("./useDeviceController");
    const controller = useDeviceController();

    controller.onConnectionCheck();
    mocks.mutations[0].onSuccess(true);

    expect(mocks.checkDevice).toHaveBeenCalled();
    expect(mocks.onOpenPairModal).toHaveBeenCalled();
    expect(mocks.onSetTotal).toHaveBeenCalledWith(20);
  });

  it("emits failure messages for failed local check and pair", async () => {
    const { default: useDeviceController } = await import("./useDeviceController");
    const controller = useDeviceController();

    mocks.mutations[0].onSuccess(false);
    controller.onPairSuccess(false);

    expect(mocks.emit).toHaveBeenCalledWith("Device not found");
    expect(mocks.emit).toHaveBeenCalledWith("Pair fail");
  });

  it("navigates to the connection page for a selected device", async () => {
    const { default: useDeviceController } = await import("./useDeviceController");
    const controller = useDeviceController();

    controller.onConnectDevice(7);

    expect(mocks.navigate).toHaveBeenCalledWith("/connection/7");
  });

  it("refetches and reports successful removal", async () => {
    const { default: useDeviceController } = await import("./useDeviceController");
    const controller = useDeviceController();

    controller.onConfirmRemove(true);

    expect(mocks.refetch).toHaveBeenCalled();
    expect(mocks.onCloseRemoveModal).toHaveBeenCalled();
    expect(mocks.emit).toHaveBeenCalledWith("Device is removed successfully");
  });
});
