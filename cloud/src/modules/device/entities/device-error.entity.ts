import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Device } from './device.entity';

@Entity('device_error')
export class DeviceError {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_device_error_code')
  @Column({ type: 'smallint' })
  code!: number;

  @Column({ type: 'varchar', length: 200 })
  message!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @Index('idx_device_error_device_id')
  @ManyToOne(() => Device, (device) => device.errors, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device!: Device;
}
