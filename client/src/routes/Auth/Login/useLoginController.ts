import { useMutation } from "@tanstack/react-query";
import React, { SubmitEvent } from "react";
import { useNavigate } from "react-router";
import { AuthSignInModel } from "src/models";
import { apiManager } from "src/services/api/ApiManager";
import { commonUtil } from "src/utils";
import { popupEventBus } from "src/utils/popupUtil";
import { routeName } from "src/utils/routeUtil";

const useLoginController = () => {
  const navigate = useNavigate();
  const { mutate } = useMutation({
    mutationFn: (model: AuthSignInModel) => apiManager.userApi.login(model),
    onSuccess: () => {
      popupEventBus.emit("Successfully logged in");
      navigate(routeName.device);
    },
    onError: commonUtil.handleError,
  });

  const [authModel, setAuthModel] = React.useState<AuthSignInModel>({
    email: "",
    pw: "",
  });

  const onChange = (value: string, key: keyof AuthSignInModel) => {
    setAuthModel({
      ...authModel,
      [key]: value.trim(),
    });
  };

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    if (authModel.email && authModel.pw) {
      mutate(authModel);
    } else {
      popupEventBus.emit("Enter email and password");
    }
  };

  return {
    onSubmit,
    authModel,
    onChange,
  };
};

export default useLoginController;
