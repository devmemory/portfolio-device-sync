import React from "react";
import { Button } from "src/components/Button";

interface Props {
  isPending: boolean;
  onConnect: VoidFunction;
}

const ConnectionCard = ({ isPending, onConnect }: Props) => {
  return (
    <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-semibold text-primary-700">Device manager</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">
          Pair and control AMQP devices
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          Connect to the local device agent, request a pair token, then send
          test messages or remove registered devices.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onConnect} disabled={isPending}>
          Connect
        </Button>
      </div>
    </section>
  );
};

export default ConnectionCard;
