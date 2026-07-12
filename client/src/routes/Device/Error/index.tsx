import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Link, useParams } from "react-router";
import { Button } from "src/components/Button";
import { Pagination } from "src/components/Pagination";
import { Table } from "src/components/Table";
import { ERR_MSG } from "src/constants/deviceErrConst";
import { usePagination } from "src/hooks";
import { apiManager } from "src/services/api/ApiManager";
import { routeName } from "src/utils/routeUtil";

const ERROR_TABLE_HEAD = ["code", "type", "message", "created"] as const;

const formatDate = (value: Date) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
};

const getErrorLabel = (code: number): string => {
  return ERR_MSG[code as keyof typeof ERR_MSG] ?? "Unknown error code";
};

const DeviceError = () => {
  const { id } = useParams<{ id: string }>();
  const { pageModel, onChangePage, onSetTotal } = usePagination();
  const deviceId = Number(id);

  const { data, isFetching } = useQuery({
    queryKey: ["deviceError", id, pageModel],
    queryFn: () =>
      apiManager.deviceApi.getErrors({
        deviceId,
        page: pageModel.page,
        limit: pageModel.limit,
      }),
    enabled: Number.isFinite(deviceId),
  });

  useEffect(() => {
    if (data) {
      onSetTotal(data.total);
    }
  }, [data]);

  console.log({pageModel})

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-700">
              Device #{id}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-ink-900">
              Error history
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-600">
              Review recent local agent, MQTT, ffmpeg, UDP, and WebRTC errors
              reported by this device.
            </p>
          </div>

          <Link to={routeName.device}>
            <Button variant="secondary">Back to devices</Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-lg font-bold text-ink-900">
            Error logs {data?.total}
          </h2>
          <p className="text-sm text-ink-600">
            {isFetching ? "Loading device errors..." : "Latest errors first"}
          </p>
        </div>

        <Table>
          <Table.Head list={[...ERROR_TABLE_HEAD]} />
          <Table.Body>
            {data?.list.map((error, index) => {
              const errorLabel = getErrorLabel(error.code);
              const isUnknown = errorLabel === "Unknown error code";

              return (
                <Table.Row key={`${error.code}-${error.createdAt}-${index}`}>
                  <Table.Td label="code">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                        isUnknown
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {error.code}
                    </span>
                  </Table.Td>
                  <Table.Td label="type">
                    <span className="font-semibold">{errorLabel}</span>
                  </Table.Td>
                  <Table.Td label="message">
                    <span className="text-ink-700">{error.message || "-"}</span>
                  </Table.Td>
                  <Table.Td label="created">
                    {formatDate(error.createdAt)}
                  </Table.Td>
                </Table.Row>
              );
            })}

            {!isFetching && data?.list.length === 0 && (
              <Table.Row>
                <Table.Td className="text-center text-ink-500" colSpan={4}>
                  No errors have been reported for this device.
                </Table.Td>
              </Table.Row>
            )}
          </Table.Body>
        </Table>

        <Pagination
          currentPage={pageModel.page}
          lastPage={pageModel.lastPage}
          onPageChange={onChangePage}
        />
      </section>
    </div>
  );
};

export default DeviceError;
