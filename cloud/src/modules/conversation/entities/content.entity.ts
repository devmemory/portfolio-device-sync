import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('content')
@Index('idx_content_history', ['conversation', 'createdAt'])
export class Content {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'smallint', name: 'speaker_type' })
  speakerType!: number; // 0: User, 1: AI

  @ManyToOne(() => Conversation, (conversation) => conversation.contents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
