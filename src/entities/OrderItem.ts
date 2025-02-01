// src/entities/OrderItem.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne
  } from 'typeorm';
  import { GroceryItem } from './GroceryItem';
  import { Order } from './Order';
  
  @Entity()
  export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column()
    quantity!: number;
  
    @ManyToOne(() => GroceryItem, (grocery) => grocery.orderItems, {
      onDelete: 'CASCADE',
    })
    grocery!: GroceryItem;
  
    @ManyToOne(() => Order, (order) => order.items, {
      onDelete: 'CASCADE',
    })
    order!: Order;
  }
  