export interface DeviceQRModel {
  name: string;
  description?: string;
  uuid: string;
}

export interface DeviceInfoModel {
  name: string;
  description?: string;
  token?: string;
}

export interface DeviceModel extends Omit<DeviceInfoModel, "token"> {
  id: number;
}

export interface MsgModel {
  deviceId: number;
  message: {
    type: string;
    data?: any;
  };
}

export interface DeviceErrorModel {
  code: number;
  message: string;
  createdAt: Date;
}
