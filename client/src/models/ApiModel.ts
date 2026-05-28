export interface ApiOptions {
  baseURL?: string;
  timeout?: number;
}

export interface ResultModel<T> {
  code: number;
  status?: number;
  message: string;
  data?: T;
}
