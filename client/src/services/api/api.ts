import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { ResultModel } from "src/models";
import { authUtil, commonUtil } from "src/utils";
import { apiErrorHandler } from "./ApiErrorHandler";

export default class Api {
  private instance: AxiosInstance;

  constructor(baseURL = "", timeout = 30000) {
    this.instance = axios.create({
      baseURL,
      timeout,
    });

    this.instance.interceptors.request.use(
      (config) => {
        if (authUtil.isLoggedIn) {
          config.headers.Authorization = `Bearer ${authUtil.getToken.accessToken}`;
        }

        return config;
      },
      (error) => {
        console.log({ error });
        return Promise.reject(error);
      },
    );

    this.instance.interceptors.response.use(
      (response) => {
        console.log({ response });
        return response;
      },
      (error) => {
        console.log({ error });
        return apiErrorHandler(error);
      },
    );
  }

  protected async get<T>(url: string, params?: any) {
    const res = await this.instance.get<ResultModel<T>>(url, { params });

    if (commonUtil.checkResult(res)) {
      throw new Error(res.data.message);
    }

    return res.data;
  }

  protected async post<T>(url: string, data: any, config?: AxiosRequestConfig) {
    const res = await this.instance.post<ResultModel<T>>(url, data, config);

    if (commonUtil.checkResult(res)) {
      throw new Error(res.data.message);
    }

    return res.data;
  }

  protected async put<T>(url: string, data: any, config?: AxiosRequestConfig) {
    const res = await this.instance.put<ResultModel<T>>(url, data, config);

    if (commonUtil.checkResult(res)) {
      throw new Error(res.data.message);
    }

    return res.data;
  }

  protected async delete<T>(
    url: string,
    data: any,
    config?: Omit<AxiosRequestConfig, "data">,
  ) {
    const res = await this.instance.delete<ResultModel<T>>(url, {
      ...config,
      data,
    });

    if (commonUtil.checkResult(res)) {
      throw new Error(res.data.message);
    }

    return res.data;
  }
}
