import React, { lazy } from "react";
import { createBrowserRouter } from "react-router";
import Layout from "src/components/Layout";

const Main = lazy(() => import("../routes/Main"));
const Login = lazy(() => import("../routes/Auth/Login"));
const Conversation = lazy(() => import("../routes/Conversation"));
const Connection = lazy(() => import("../routes/Connection"));
const Device = lazy(() => import("../routes/Device"));
const DeviceError = lazy(() => import("../routes/Device/Error"));
const Register = lazy(() => import("../routes/Auth/Register"));
const NotFound = lazy(() => import("../routes/NotFound"));

export const routeName = {
  main: "/",
  login: "/auth/login",
  register: "/auth/register",
  conversation: "/conversation",
  connection: "/connection",
  device: "/device",
  deviceError: "/device/error",
  deviceQR: "/device/qr",
  notFound: "*",
} as const;

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: routeName.main,
        element: <Main />,
      },
      {
        path: routeName.login,
        element: <Login />,
      },
      {
        path: routeName.register,
        element: <Register />,
      },
      {
        path: routeName.conversation,
        element: <Conversation />,
      },
      {
        path: routeName.connection + "/:id",
        element: <Connection />,
      },
      {
        path: routeName.device,
        element: <Device />,
      },
      {
        path: routeName.deviceError + "/:id",
        element: <DeviceError />,
      },
      {
        path: routeName.notFound,
        element: <NotFound />,
      },
    ],
  },
]);
