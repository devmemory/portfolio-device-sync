import React from "react";
import { Button } from "src/components/Button";
import { Switch } from "src/components/Condition";
import { CONNECTION_STATE, CONNECTION_TYPE } from "src/constants";

interface Props {
  id?: string;
  connection: CONNECTION_TYPE;
  onConnect: VoidFunction;
  onDisconnect: VoidFunction;
}

const Status = ({ id, connection, onConnect, onDisconnect }: Props) => {
  const isConnected = connection === CONNECTION_STATE.connected;

  return (
    <aside className="grid content-start gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-ink-900">Session status</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-600">Device</dt>
            <dd className="font-semibold text-ink-900">#{id}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-600">Signal</dt>
            <dd className="font-semibold text-ink-900">
              Device{" "}
              {connection !== CONNECTION_STATE.offline ? "Online" : "Offline"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-ink-600">Peer</dt>
            <dd
              className={`font-semibold ${
                isConnected ? "text-primary-700" : "text-ink-600"
              }`}
            >
              {isConnected ? "Online" : "Offline"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-ink-900">Connection</h2>
        <p className="mt-2 text-sm text-ink-600">
          Use the session controls when switching between devices or ending a
          stream.
        </p>
        <div className="mt-4 grid gap-2">
          <Switch
            when={connection}
            connected={
              <Button onClick={onDisconnect} variant="danger">
                Disconnect stream
              </Button>
            }
            offline={<Button disabled>Device offline</Button>}
            ready={
              <Button onClick={onConnect} variant="primary">
                Connect stream
              </Button>
            }
            connecting={<Button disabled>Connecting...</Button>}
          />
        </div>
      </div>
    </aside>
  );
};

export default Status;
