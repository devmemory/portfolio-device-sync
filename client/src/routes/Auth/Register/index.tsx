import React from "react";
import { Link } from "react-router";
import { AuthCard } from "src/components/AuthCard";
import { Button } from "src/components/Button";
import { Input } from "src/components/Input";
import { routeName } from "src/utils/routeUtil";
import useRegisterController from "./useRegisterController";

const Register = () => {
  const { onSubmit, authModel, onChange, pwConfirm, setPwConfirm } =
    useRegisterController();

  return (
    <AuthCard>
      <AuthCard.Header>
        <p className="text-sm font-semibold text-primary-700">Create account</p>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">Register</h1>
        <p className="mt-2 text-sm text-ink-600">
          Create an account before pairing MQTT devices.
        </p>
      </AuthCard.Header>
      <AuthCard.Body>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Input
            label="Name"
            placeholder="Device admin"
            value={authModel.name}
            onChange={(e) => onChange(e.target.value, "name")}
          />
          <Input
            label="Email"
            placeholder="name@example.com"
            type="email"
            value={authModel.email}
            onChange={(e) => onChange(e.target.value, "email")}
          />
          <Input
            label="Password"
            placeholder="Create a password"
            type="password"
            value={authModel.pw}
            onChange={(e) => onChange(e.target.value, "pw")}
          />
          <Input
            label="Confirm password"
            placeholder="Repeat your password"
            type="password"
            value={pwConfirm}
            onChange={(e) => setPwConfirm(e.target.value.trim())}
          />
          <Button className="w-full" type="submit">
            Register
          </Button>
        </form>
        <p className="text-center text-sm text-ink-600">
          Already registered?{" "}
          <Link className="font-semibold text-primary-700" to={routeName.login}>
            Login
          </Link>
        </p>
      </AuthCard.Body>
    </AuthCard>
  );
};

export default Register;
