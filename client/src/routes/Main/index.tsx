import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "src/components/Button";
import { Show } from "src/components/Condition";
import { MAIN_BTN_TEXT, MAIN_FLOW_TEXT } from "src/constants";
import { authUtil } from "src/utils";
import { routeName } from "src/utils/routeUtil";

const Main = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    console.log(import.meta.env.VITE_WS_BASE_URL)
    setIsLoggedIn(authUtil.isLoggedIn);
  }, []);

  return (
    <div className="grid gap-8">
      <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold text-primary-700">
            AMQP device console
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink-900 sm:text-4xl">
            Connect, pair, and test local devices from one workspace.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink-600">
            A compact client for signing in, pairing hardware through the local
            agent, and sending AMQP test messages.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={routeName.device}>
              <Button>Open devices</Button>
            </Link>
            <Show when={!isLoggedIn}>
              <Link to={routeName.login}>
                <Button variant="secondary">Sign in</Button>
              </Link>
            </Show>
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          {MAIN_BTN_TEXT.map((e) => (
            <div key={e.title} className="rounded-md bg-white p-4 shadow-sm">
              <h2 className="text-sm font-bold text-ink-900">{e.title}</h2>
              <p className="mt-1 text-sm text-ink-600">{e.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {MAIN_FLOW_TEXT.map((e, i) => (
          <div
            key={`flow-${i}`}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-50 font-bold text-primary-700">
              {i + 1}
            </span>
            <h2 className="mt-4 font-bold text-ink-900">{e.title}</h2>
            <p className="mt-1 text-sm text-ink-600">{e.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Main;
