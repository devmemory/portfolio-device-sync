import React from "react";
import { Link } from "react-router";
import { Button } from "src/components/Button";
import { routeName } from "src/utils/routeUtil";

interface Props {
  id?: string;
}

const ConnectionHeader = ({ id }: Props) => {
  return (
    <section className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
      <div>
        <p className="text-sm font-semibold text-primary-700">
          Live connection
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">
          Device #{id} video session
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          Start a WebRTC session to view the remote device stream and monitor
          connection status.
        </p>
      </div>
      <Link to={routeName.device}>
        <Button variant="secondary">Back to devices</Button>
      </Link>
    </section>
  );
};

export default ConnectionHeader;
