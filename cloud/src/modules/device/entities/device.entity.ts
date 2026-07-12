import { BaseTimeEntity } from '@/common';
import { User } from '@/modules/user/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { DeviceError } from './device-error.entity';
import { DeviceInfo } from './device-info.entity';

@Entity('device')
@Index('idx_device_user_lookup', ['user', 'id'], { where: '"deleted_at" IS NULL' })
export class Device extends BaseTimeEntity {
  @Column({ name: 'machine_id', type: 'varchar', length: 200, unique: true })
  machineId!: string;

  @Column({ type: 'varchar', length: 30 })
  name!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description?: string;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => DeviceError, (error) => error.device)
  errors?: DeviceError[];

  @OneToOne(() => DeviceInfo, (info) => info.device)
  info?: DeviceInfo;
}
