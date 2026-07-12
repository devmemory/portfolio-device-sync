import React from "react";
import { Link } from "react-router";
import { Button } from "src/components/Button";
import { Show } from "src/components/Condition";
import { Pagination } from "src/components/Pagination";
import { Table } from "src/components/Table";
import { DEVICE_TABLE_HEAD, SERVICE_NAME } from "src/constants";
import { routeName } from "src/utils/routeUtil";
import ConnectionCard from "./ConnectionCard";
import AddDeviceModal from "./modal/AddDeviceModal";
import DeleteDeviceModal from "./modal/DeleteDeviceModal";
import useConnectionController from "./useConnectionController";
import useDeviceController from "./useDeviceController";

const DeviceList = () => {
  const {
    pageModel,
    onChangePage,
    data,
    isPairModalOpen,
    onClosePairModal,
    isRemoveModalOpen,
    onOpenRemove,
    onCancelRemove,
    onConfirmRemove,
    onPairSuccess,
    selectedDeviceId,
    onConnectionCheck,
    isCheckPending,
  } = useDeviceController();
  const { onConnectDevice, isPendingConnection } = useConnectionController();

  return (
    <div className="grid gap-6">
      <ConnectionCard
        onConnect={onConnectionCheck}
        isPending={isCheckPending}
      />

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-900">Registered devices</h2>
          <p className="text-sm text-ink-600">
            {data?.total ?? 0} devices found
          </p>
        </div>

        <Table>
          <Table.Head list={DEVICE_TABLE_HEAD} />
          <Table.Body>
            {data?.list.map((device) => {
              return (
                <Table.Row key={device.id}>
                  <Table.Td label="id">
                    <Link to={`${routeName.deviceError}/${device.id}`}>
                      #{device.id}
                    </Link>
                  </Table.Td>
                  <Table.Td label="name">
                    <span className="font-semibold">{device.name}</span>
                  </Table.Td>
                  <Table.Td label="description">
                    {device.description || "-"}
                  </Table.Td>
                  <Table.Td label="action">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          onConnectDevice(device.id, SERVICE_NAME.AI)
                        }
                      >
                        Connect AI
                      </Button>
                      <Button
                        onClick={() =>
                          onConnectDevice(device.id, SERVICE_NAME.MEDIA)
                        }
                        variant="secondary"
                        disabled={isPendingConnection}
                      >
                        Connect Media
                      </Button>
                      <Button
                        onClick={() => onOpenRemove(device.id)}
                        variant="danger"
                      >
                        Delete
                      </Button>
                    </div>
                  </Table.Td>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>

        <Pagination
          currentPage={pageModel.page}
          lastPage={pageModel.lastPage}
          onPageChange={onChangePage}
        />
      </section>

      <Show when={isPairModalOpen}>
        <AddDeviceModal
          onPairSuccess={onPairSuccess}
          onClosePairModal={onClosePairModal}
        />
      </Show>

      <Show when={isRemoveModalOpen}>
        <DeleteDeviceModal
          deviceId={selectedDeviceId}
          onConfirmRemove={onConfirmRemove}
          onCancelRemove={onCancelRemove}
        />
      </Show>
    </div>
  );
};

export default DeviceList;
