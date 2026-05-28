import React from "react";
import { useNavigate } from "react-router";
import { Button } from "src/components/Button";
import { routeName } from "src/utils/routeUtil";

const NotFound = () => {
  const navigate = useNavigate();

  const onMoveToHome = () => {
    navigate(routeName.main);
  };

  return (
    <div className="mx-auto grid max-w-lg gap-5 rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold text-primary-700">404</p>
      <h1 className="text-3xl font-bold text-ink-900">Page not found</h1>
      <p className="text-sm text-ink-600">
        The page you requested does not exist in this MQTT client.
      </p>
      <Button className="mx-auto" onClick={onMoveToHome}>
        Go home
      </Button>
    </div>
  );
};

export default NotFound;
