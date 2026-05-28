import React, { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  matchPath,
} from "react-router";
import { authUtil } from "src/utils";
import { popupEventBus } from "src/utils/popupUtil";
import { routeName } from "src/utils/routeUtil";
import { Button } from "../Button";
import { Popup } from "../Popup";

const Layout = () => {
  const { pathname, key } = useLocation();

  const navigate = useNavigate();

  const [hasToken, setHasToken] = useState(authUtil.isLoggedIn);

  const forbiddenPath: string[] = [
    routeName.device,
    routeName.connection,
    routeName.deviceQR,
    routeName.deviceError,
  ];

  useEffect(() => {
    setHasToken(authUtil.isLoggedIn);

    if (!authUtil.isLoggedIn) {
      const isForbidden = forbiddenPath.some((path) =>
        matchPath({ path, end: false }, pathname),
      );

      if (isForbidden) {
        popupEventBus.emit("Please log in first");
        navigate(routeName.login);
      }
    }
  }, [key]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-primary-50 text-primary-700"
        : "text-ink-600 hover:bg-slate-100"
    }`;

  const onLogout = () => {
    authUtil.deleteToken();
    setHasToken(false);
    navigate(routeName.login);
  };

  return (
    <>
      <Popup />
      <div className="min-h-full">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link
              to={routeName.main}
              className="flex items-center gap-2 font-bold text-ink-900"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
                MQ
              </span>
              <span>MQTT Client</span>
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to={routeName.main} className={navClass}>
                Home
              </NavLink>
              <NavLink to={routeName.device} className={navClass}>
                Devices
              </NavLink>
              {hasToken ? (
                <Button
                  className="min-h-9 px-3 py-2"
                  onClick={onLogout}
                  variant="secondary"
                >
                  Logout
                </Button>
              ) : (
                <NavLink to={routeName.login} className={navClass}>
                  Login
                </NavLink>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-65px)] max-w-6xl px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;
