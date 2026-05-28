import { useMutation } from "@tanstack/react-query";
import React from "react";
import { Button } from "src/components/Button";
import { Modal } from "src/components/Modal";
import { apiManager } from "src/services/ApiManager";
import { commonUtil } from "src/utils";

interface Props {
  deviceId: number | null;
  onConfirmRemove: (value: boolean | undefined) => void;
  onCancelRemove: VoidFunction;
}

const DeleteDeviceModal = ({
  deviceId,
  onConfirmRemove,
  onCancelRemove,
}: Props) => {
  const { mutate, isPending } = useMutation({
    mutationFn: (deviceId: number) =>
      apiManager.deviceApi.removeDevice(deviceId),
    onSuccess: onConfirmRemove,
    onError: commonUtil.handleError,
  });

  const onDelete = () => {
    if (deviceId) {
      mutate(deviceId);
    }
  };

  return (
    <Modal
      description="This device will be removed from the registered device list."
      isOpen
      onClose={onCancelRemove}
      title="Delete device"
    >
      <div className="grid gap-5">
        <p className="text-sm text-ink-900">
          Are you sure you want to delete this device?
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={onCancelRemove} variant="secondary">
            Cancel
          </Button>
          <Button disabled={isPending} onClick={onDelete} variant="danger">
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteDeviceModal;
