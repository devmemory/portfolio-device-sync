export interface ResultModel<T> {
  code: number;
  message: string;
  data: T;
}