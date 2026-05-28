import { AxiosError, AxiosResponse } from "axios";
import { RETURN_CODE } from "src/constants";
import { ResultModel } from "src/models";
import { popupEventBus } from "./popupUtil";

export const commonUtil = {
  delay: (ms: number) => {
    return new Promise<void>((res) => {
      const timer = setTimeout(() => {
        res();
        clearTimeout(timer);
      }, ms);
    });
  },
  checkResult: (res: AxiosResponse<ResultModel<unknown>>) => {
    return res.data.code !== RETURN_CODE.SUCCESS;
  },
  handleError: (res: AxiosError) => {
    const data = res.response?.data as any;

    const msg = data.message ?? res.message;

    popupEventBus.emit(msg);
  },
};
