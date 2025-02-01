// src/entities/GroceryItem.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OrderItem } from './OrderItem';

@Entity()
export class GroceryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column('float')
  price!: number;

  @Column()
  inventory!: number;

  // If you want to see which OrderItems reference this grocery
  @OneToMany(() => OrderItem, (orderItem) => orderItem.grocery)
  orderItems!: OrderItem[];
}
