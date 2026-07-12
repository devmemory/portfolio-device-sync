import { useMutation } from "@tanstack/react-query";
import React, { SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { AuthSignUpModel } from "src/models";
import { apiManager } from "src/services/api/ApiManager";
import { commonUtil } from "src/utils";
import { popupEventBus } from "src/utils/popupUtil";
import { routeName } from "src/utils/routeUtil";

const useRegisterController = () => {
  const navigate = useNavigate();

  const { mutate } = useMutation({
    mutationFn: (model: AuthSignUpModel) => apiManager.userApi.register(model),
    onSuccess: () => {
      popupEventBus.emit("Successfully registered");
      navigate(routeName.device);
    },
    onError: commonUtil.handleError,
  });

  const [authModel, setAuthModel] = React.useState<AuthSignUpModel>({
    email: "",
    pw: "",
    name: "",
  });
  const [pwConfirm, setPwConfirm] = React.useState<string>("");

  const onChange = (value: string, key: keyof AuthSignUpModel) => {
    setAuthModel({
      ...authModel,
      [key]: value.trim(),
    });
  };

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    if (!authModel.name || !authModel.email || !authModel.pw) {
      popupEventBus.emit("Complete all fields");
      return;
    }

    if (authModel.pw !== pwConfirm.trim()) {
      popupEventBus.emit("Passwords do not match");
      return;
    }

    if (authModel.pw.length < 8) {
      popupEventBus.emit("Password must be at least 8 characters");
      return;
    }

    mutate(authModel);
  };

  return {
    onSubmit,
    authModel,
    onChange,
    pwConfirm,
    setPwConfirm,
  };
};

export default useRegisterController;
