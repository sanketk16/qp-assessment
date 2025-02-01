"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
// src/data-source.ts
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const GroceryItem_1 = require("./entities/GroceryItem");
const Order_1 = require("./entities/Order");
const OrderItem_1 = require("./entities/OrderItem");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'sqlite',
    database: 'db.sqlite',
    synchronize: true,
    logging: false,
    entities: [GroceryItem_1.GroceryItem, Order_1.Order, OrderItem_1.OrderItem],
});
