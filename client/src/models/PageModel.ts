export interface PageModel {
  page: number;
  limit: number;
}

export interface PageWithDeviceId extends PageModel {
  deviceId: number;
}
