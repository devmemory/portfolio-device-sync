import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Device } from './device.entity';

@Entity('device_info')
export class DeviceInfo {
  @PrimaryColumn({ name: 'device_id', type: 'integer' })
  deviceId!: number;

  @Column({ name: 'user_id', type: 'varchar', length: 50 })
  userId!: string;

  @Column({ type: 'varchar', length: 200 })
  pw!: string;

  @OneToOne(() => Device, (device) => device.info)
  @JoinColumn({ name: 'device_id' })
  device?: Device;
}
