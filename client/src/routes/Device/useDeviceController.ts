import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useDisclosure, usePagination } from "src/hooks";
import { apiManager } from "src/services/ApiManager";
import { commonUtil } from "src/utils";
import { popupEventBus } from "src/utils/popupUtil";
import { routeName } from "src/utils/routeUtil";

const useDeviceController = () => {
  const navigate = useNavigate();

  const { pageModel, onChangePage, onSetTotal } = usePagination();

  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);

  const {
    isOpen: isPairModalOpen,
    onOpen: onOpenPairModal,
    onClose: onClosePairModal,
  } = useDisclosure();

  const {
    isOpen: isRemoveModalOpen,
    onOpen: onOpenRemoveModal,
    onClose: onCloseRemoveModal,
  } = useDisclosure();

  const { data, refetch } = useQuery({
    queryKey: ["deviceList", pageModel.page],
    queryFn: () =>
      apiManager.deviceApi.getList({
        page: pageModel.page,
        limit: pageModel.limit,
      }),
  });

  const { mutate: checkDevice, isPending: isCheckPending } = useMutation({
    mutationFn: () => apiManager.localApi.checkDevice(),
    onSuccess: (value) => {
      if (value) {
        onOpenPairModal();
      } else {
        popupEventBus.emit("Device not found");
      }
    },
    onError: commonUtil.handleError,
  });

  useEffect(() => {
    if (typeof data?.total === "number") {
      onSetTotal(data.total);
    }
  }, [data?.total]);

  const onConnectionCheck = () => {
    checkDevice();
  };

  const onOpenRemove = (deviceId: number) => {
    setSelectedDeviceId(deviceId);
    onOpenRemoveModal();
  };

  const onCancelRemove = () => {
    setSelectedDeviceId(null);
    onCloseRemoveModal();
  };

  const onConfirmRemove = (value?: boolean) => {
    if (value) {
      refetch();
      onCloseRemoveModal();
      setSelectedDeviceId(null);
      popupEventBus.emit("Device is removed successfully");
    } else {
      popupEventBus.emit("Failed to remove");
    }
  };

  const onPairSuccess = (value: boolean) => {
    if (value) {
      onClosePairModal();
      refetch();
      popupEventBus.emit("Pair success");
    } else {
      popupEventBus.emit("Pair fail");
    }
  };

  const onConnectDevice = (deviceId: number) => {
    navigate(routeName.connection + `/${deviceId}`);
  };

  return {
    pageModel,
    onChangePage,
    data,
    isPairModalOpen,
    onPairSuccess,
    selectedDeviceId,
    onClosePairModal,
    isRemoveModalOpen,
    onOpenRemove,
    onCancelRemove,
    onConfirmRemove,
    onConnectDevice,
    onConnectionCheck,
    isCheckPending,
  };
};

export default useDeviceController;
