import { useMutation } from "@tanstack/react-query";
import { SubmitEvent, useEffect, useState } from "react";
import { DeviceInfoModel } from "src/models";
import { apiManager } from "src/services/api/ApiManager";
import { commonUtil } from "src/utils";
import { popupEventBus } from "src/utils/popupUtil";

interface Props {
  onPairSuccess: (value: boolean) => void;
}

const useAddDeviceController = ({ onPairSuccess }: Props) => {
  const [deviceModel, setDeviceModel] = useState<DeviceInfoModel>({
    name: "",
    description: "",
  });

  const { mutate: getPairToken, isPending: isTokenPending } = useMutation({
    mutationFn: () => apiManager.deviceApi.getPairToken(),
    onSuccess: (token) => {
      if (token) {
        onChangeDeviceInfo(token, "token");
      }
    },
    onError: commonUtil.handleError,
  });

  const { mutate: startPair, isPending: isPairPending } = useMutation({
    mutationFn: (model: DeviceInfoModel) =>
      apiManager.localApi.startPair(model),
    onSuccess: onPairSuccess,
    onError: commonUtil.handleError,
  });

  useEffect(() => {
    getPairToken();
  }, []);

  const onChangeDeviceInfo = (value: string, key: keyof DeviceInfoModel) => {
    setDeviceModel((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const onPairDevice = () => {
    const name = deviceModel.name.trim();
    const description = deviceModel.description?.trim();

    if (!deviceModel.token) {
      popupEventBus.emit("Connect to request a pair token");
      return;
    }

    if (!name) {
      popupEventBus.emit("Enter device name");
      return;
    }

    if (name.length < 3) {
      popupEventBus.emit("Device name must be at least 3 characters");
      return;
    }

    startPair({
      ...deviceModel,
      name,
      description,
    });
  };

  const onSubmitPair = (e: SubmitEvent) => {
    e.preventDefault();
    onPairDevice();
  };

  return {
    deviceModel,
    onChangeDeviceInfo,
    onSubmitPair,
    isPending: isPairPending || isTokenPending,
  };
};

export default useAddDeviceController;
