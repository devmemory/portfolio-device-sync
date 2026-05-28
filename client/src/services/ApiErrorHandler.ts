import axios, { AxiosError } from "axios";
import { RETURN_CODE } from "src/constants";
import { ResultModel, TokenResponse } from "src/models";
import { authUtil, commonUtil } from "src/utils";

let isRefreshing = false;
let refreshCompleter: Promise<void> | null = null;

export const apiErrorHandler = (error: AxiosError) => {
  console.log({ error });
  const data = error.response?.data as any;
  switch (data.code) {
    case RETURN_CODE.EXPIRED_TOKEN:
    case RETURN_CODE.INVALID_TOKEN:
      return refreshToken(error);
    case RETURN_CODE.UNAUTHORIZED:
    default:
      return Promise.reject(error);
  }
};

export const refreshToken = async (error: AxiosError) => {
  console.log("[refresh]", { isRefreshing });
  if (!isRefreshing) {
    isRefreshing = true;

    const refreshToken = authUtil.getToken.refreshToken;
    const userId = authUtil.getUser?.id;

    try {
      console.log("[refresh] start");

      const res = await axios.post<ResultModel<TokenResponse>>(
        "/api/user/refresh",
        {
          refreshToken,
          userId,
        },
      );

      console.log("[refresh] end", { res });

      if (commonUtil.checkResult(res)) {
        authUtil.deleteToken();
        location.href = "/";
        throw new Error(res.data.message);
      }

      const rm = res.data.data!;

      authUtil.setToken(rm.accessToken, rm.refreshToken);

      await refreshCompleter;
      isRefreshing = false;
      refreshCompleter = null;

      console.log("[token] promise ");

      error.config!.headers["Authorization"] =
        `Bearer ${authUtil.getToken.accessToken}`;

      const newReq = await axios.request(error.config!);

      console.log("[token] re call", { newReq });

      return newReq;
    } catch (e) {
      authUtil.deleteToken();
      location.href = "/";
    }
  }
};
