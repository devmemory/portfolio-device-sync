import React from "react";
import { Show } from "src/components/Condition";
import { CONNECTION_STATE } from "src/constants";
import ConnectionHeader from "./Header";
import Status from "./Status";
import useConnectionController from "./useConnectionController";

const Connection = () => {
  const { id, connection, videoRef, onConnect, onDisconnect } =
    useConnectionController();

  const isConnected = connection === CONNECTION_STATE.connected;

  return (
    <div className="grid gap-6">
      <ConnectionHeader id={id} />

      <section className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-ink-900 shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConnected ? "bg-primary-500" : "bg-slate-500"
                }`}
              />
              <span className="text-sm font-semibold text-white">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <span className="text-xs font-semibold uppercase text-slate-400">
              WebRTC
            </span>
          </div>

          <div className="relative aspect-video bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-contain"
            />
            <Show when={!isConnected}>
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-lg font-bold text-white">
                    MQ
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-white">
                    Stream is offline
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-slate-400">
                    Connect to begin receiving the device video feed.
                  </p>
                </div>
              </div>
            </Show>
          </div>
        </div>

        <Status
          id={id}
          connection={connection}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
        />
      </section>
    </div>
  );
};

export default Connection;
