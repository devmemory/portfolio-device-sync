import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { MSG, SERVICE_NAME } from "src/constants";
import { MsgModel } from "src/models";
import { apiManager } from "src/services/api/ApiManager";
import { popupEventBus } from "src/utils/popupUtil";
import { routeName } from "src/utils/routeUtil";

const useConnectionController = () => {
  const navigate = useNavigate();

  const { mutateAsync, isPending: isPendingConnection } = useMutation({
    mutationFn: (model: MsgModel) => apiManager.deviceApi.sendMsg(model),
  });

  const onConnectDevice = async (
    deviceId: number,
    service: keyof typeof SERVICE_NAME,
  ) => {
    try {
      const res = await mutateAsync({
        deviceId,
        message: {
          type: MSG.CHECK,
          data: service,
        },
      });

      if (!res) {
        popupEventBus.emit(`[${service}] doesn't exist on your device.`);
        return;
      }

      switch (service) {
        case SERVICE_NAME.AI:
          navigate(`${routeName.conversation}/${deviceId}`);
          break;
        case SERVICE_NAME.MEDIA:
          navigate(routeName.connection + `/${deviceId}`);
          break;
        default:
          popupEventBus.emit(`[${service}] invalid option.`);
          break;
      }
    } catch (e) {
      popupEventBus.emit(`${e}`);
    }
  };

  return {
    onConnectDevice,
    isPendingConnection,
  };
};

export default useConnectionController;
