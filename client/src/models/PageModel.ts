export interface PageModel {
  page: number;
  limit: number;
  order?: "ASC" | "DESC";
  orderBy?: string;
}

export interface PageWithDeviceId extends PageModel {
  deviceId: number;
}
