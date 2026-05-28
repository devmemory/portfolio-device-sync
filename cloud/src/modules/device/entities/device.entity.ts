import { BaseTimeEntity } from '@/common';
import { User } from '@/modules/user/entities/user.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { DeviceError } from './device-error.entity';
import { DeviceInfo } from './device-info.entity';

@Entity('device')
export class Device extends BaseTimeEntity {
  @Column({ name: 'machine_id', type: 'varchar', length: 200, unique: true })
  machineId!: string;

  @Index('idx_device_name')
  @Column({ type: 'varchar', length: 30 })
  name!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description?: string;

  @Index('idx_device_users_id')
  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => DeviceError, (error) => error.device)
  errors?: DeviceError[];

  @OneToOne(() => DeviceInfo, (info) => info.device)
  info?: DeviceInfo;
}
