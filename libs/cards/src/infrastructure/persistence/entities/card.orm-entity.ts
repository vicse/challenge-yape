import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('cards')
export class CardOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  requestId: string;

  @Column()
  documentType: string;

  @Column()
  @Index({ unique: true })
  documentNumber: string;

  @Column()
  fullName: string;

  @Column()
  age: number;

  @Column()
  email: string;

  @Column()
  cardType: string;

  @Column()
  currency: string;

  @Column()
  status: string;

  @Column({ nullable: true })
  cardNumber?: string;

  @Column({ nullable: true })
  expirationDate?: string;

  @Column({ nullable: true })
  cvv?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
