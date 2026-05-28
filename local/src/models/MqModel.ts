export interface MqAccountModel {
  username: string;
  password: string;
}

export interface MqConenctionModel extends MqAccountModel {
  machineId: string;
}
