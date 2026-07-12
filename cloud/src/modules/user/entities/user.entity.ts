import { BaseTimeEntity } from '@/common';
import { Conversation } from '@/modules/conversation/entities/conversation.entity';
import { Device } from '@/modules/device/entities/device.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';

@Entity('users')
export class User extends BaseTimeEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 200 })
  pw!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  name!: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    name: 'refresh_token',
  })
  refreshToken?: string;

  @Column({
    type: 'smallint',
    default: 1,
    name: 'token_version',
  })
  tokenVersion: number = 1;

  @OneToMany(() => Device, (device) => device.user)
  devices?: Device[];

  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations?: Conversation[];
}
