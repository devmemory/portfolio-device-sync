import { User } from '@/modules/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Content } from './content.entity';

@Entity('conversation')
@Index('idx_conversation_lookup', ['user', 'updatedAt'], {
  where: '"deleted_at" IS NULL',
})
@Index('idx_conversation_user', ['id', 'user'])
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({type: "varchar",length: 50})
  title!: string;

  @ManyToOne(() => User, (user) => user.conversations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToMany(() => Content, (content) => content.conversation)
  contents?: Content[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', default: null })
  deletedAt: Date | null = null;
}
