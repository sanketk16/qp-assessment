// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { GroceryItem } from './entities/GroceryItem';
import { Order } from './entities/Order';
import { OrderItem } from './entities/OrderItem';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'db.sqlite',       
  synchronize: true,
  logging: false,
  entities: [GroceryItem, Order, OrderItem],
});
