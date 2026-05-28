import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cleanups: [] as VoidFunction[],
  disposeAll: vi.fn(),
  disposePeer: vi.fn(),
  emit: vi.fn(),
  initPeer: vi.fn(),
  params: { id: "9" },
  sendOffer: vi.fn(),
  unsubscribe: vi.fn(),
  services: [] as MockWebRTCService[],
}));

class MockWebRTCService {
  connectionState = "offline";
  video: HTMLVideoElement | null = null;
  constructor(public deviceId: number) {
    mocks.services.push(this);
  }
  disposeAll = mocks.disposeAll;
  disposePeer = mocks.disposePeer;
  initListner = vi.fn();
  initPeer = mocks.initPeer;
  onChangeConnection = vi.fn(() => mocks.unsubscribe);
  sendOffer = mocks.sendOffer;
}

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useEffect: (fn: () => void | VoidFunction) => {
      const cleanup = fn();
      if (typeof cleanup === "function") {
        mocks.cleanups.push(cleanup);
      }
    },
    useRef: <T,>(current: T) => ({ current }),
    useState: <T,>(initial: T) => [initial, vi.fn()] as const,
  };
});

vi.mock("react-router", () => ({
  useParams: () => mocks.params,
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock("src/services/webrtc/webRTC", () => ({
  WebRTCService: MockWebRTCService,
}));

vi.mock("src/services/ApiManager", () => ({
  apiManager: { deviceApi: { sendMsg: vi.fn() } },
}));

vi.mock("src/utils/popupUtil", () => ({
  popupEventBus: { emit: mocks.emit },
}));

describe("useConnectionController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cleanups = [];
    mocks.params = { id: "9" };
    mocks.services = [];
  });

  it("initializes and cleans up a WebRTC service for a valid device id", async () => {
    const { default: useConnectionController } = await import("./useConnectionController");

    useConnectionController();

    expect(mocks.services).toHaveLength(1);
    expect(mocks.services[0].deviceId).toBe(9);
    expect(mocks.services[0].initListner).toHaveBeenCalled();
    expect(mocks.services[0].onChangeConnection).toHaveBeenCalled();

    mocks.cleanups.forEach((cleanup) => cleanup());

    expect(mocks.unsubscribe).toHaveBeenCalled();
    expect(mocks.disposeAll).toHaveBeenCalled();
  });

  it("emits a failure for an invalid device id", async () => {
    mocks.params = { id: "bad" };
    const { default: useConnectionController } = await import("./useConnectionController");

    useConnectionController();

    expect(mocks.emit).toHaveBeenCalledWith("Invalid device id");
    expect(mocks.services).toHaveLength(0);
  });

  it("exposes connect and disconnect controls", async () => {
    const { default: useConnectionController } = await import("./useConnectionController");
    const controller = useConnectionController();

    controller.onConnect();
    controller.onDisconnect();

    expect(mocks.initPeer).toHaveBeenCalled();
    expect(mocks.sendOffer).toHaveBeenCalled();
    expect(mocks.disposePeer).toHaveBeenCalled();
  });
});
