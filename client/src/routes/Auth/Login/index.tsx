import React from "react";
import { Link } from "react-router";
import { AuthCard } from "src/components/AuthCard";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import { routeName } from "src/utils/routeUtil";
import useLoginController from "./useLoginController";

const Login = () => {
  const { onSubmit, authModel, onChange } = useLoginController();

  return (
    <AuthCard>
      <AuthCard.Header>
        <p className="text-sm font-semibold text-primary-700">Welcome back</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">Login</h1>
        <p className="mt-2 text-sm text-ink-600">
          Sign in to manage registered AMQP devices.
        </p>
      </AuthCard.Header>
      <AuthCard.Body>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Input
            label="Email"
            placeholder="name@example.com"
            type="email"
            value={authModel.email}
            onChange={(e) => onChange(e.target.value, "email")}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            type="password"
            value={authModel.pw}
            onChange={(e) => onChange(e.target.value, "pw")}
          />
          <Button className="w-full" type="submit">
            Login
          </Button>
        </form>
        <p className="text-center text-sm text-ink-600">
          No account?{" "}
          <Link
            className="font-semibold text-primary-700"
            to={routeName.register}
          >
            Create one
          </Link>
        </p>
      </AuthCard.Body>
    </AuthCard>
  );
};

export default Login;
