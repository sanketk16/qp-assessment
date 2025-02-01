// src/entities/Order.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany
  } from 'typeorm';
  import { OrderItem } from './OrderItem';
  
  @Entity()
  export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
      cascade: true,
    })
    items!: OrderItem[];
  
    @Column('float')
    totalPrice!: number;
  }
  