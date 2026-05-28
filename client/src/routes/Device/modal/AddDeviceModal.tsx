import React from "react";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import { Modal } from "src/components/Modal";
import useAddDeviceController from "./useAddDeviceController";

interface Props {
  onPairSuccess: (value: boolean) => void;
  onClosePairModal: VoidFunction;
}

const AddDeviceModal = ({
  onPairSuccess,
  onClosePairModal,
}: Props) => {
  const { deviceModel, onChangeDeviceInfo, onSubmitPair, isPending } =
    useAddDeviceController({ onPairSuccess });

  return (
    <Modal
      description="Name the device before finalizing the pair request."
      isOpen
      onClose={onClosePairModal}
      title="Configure device"
    >
      <form className="grid gap-4" onSubmit={onSubmitPair}>
        <Input
          label="Device name"
          placeholder="Living room sensor"
          value={deviceModel.name}
          onChange={(e) => onChangeDeviceInfo(e.target.value, "name")}
        />
        <Input
          label="Description"
          placeholder="Optional device description"
          value={deviceModel.description ?? ""}
          onChange={(e) => onChangeDeviceInfo(e.target.value, "description")}
        />
        <Input
          disabled
          label="Pair token"
          value={deviceModel.token ?? "Connect to request a token"}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClosePairModal} variant="secondary">
            Cancel
          </Button>
          <Button disabled={isPending} type="submit">
            {isPending ? "Pairing..." : "Connect / Pair"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddDeviceModal;
