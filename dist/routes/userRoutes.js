"use strict";
// // src/routes/userRoutes.ts
// import { Router, Request, Response } from 'express';
// import { v4 as uuidv4 } from 'uuid';
// import { groceryItems } from '../data/groceryData';
// import { orders } from '../data/orderData';
// import { Order, OrderItem, OrderDetail } from '../models/Order';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// const userRouter = Router();
// /**
//  * View the list of available grocery items
//  */
// userRouter.get('/grocery', (req: Request, res: Response) => {
//   const availableItems = groceryItems.filter(item => item.inventory > 0);
//   return res.json({ message: 'Available grocery items', data: availableItems });
// });
// /**
//  * Book multiple grocery items in a single order
//  */
// userRouter.post('/order', (req: Request, res: Response) => {
//   const { items } = req.body as { items: OrderItem[] };
//   if (!items || !Array.isArray(items) || items.length === 0) {
//     return res.status(400).json({ message: 'Invalid order data' });
//   }
//   let totalPrice = 0;
//   const orderDetails: OrderDetail[] = [];
//   for (const orderItem of items) {
//     const grocery = groceryItems.find(g => g.id === orderItem.groceryId);
//     if (!grocery) {
//       return res.status(400).json({ message: `Grocery item not found: ${orderItem.groceryId}` });
//     }
//     // Check inventory
//     if (grocery.inventory < orderItem.quantity) {
//       return res
//         .status(400)
//         .json({ message: `Not enough inventory for item: ${grocery.name}` });
//     }
//     // Deduct inventory
//     grocery.inventory -= orderItem.quantity;
//     const itemCost = grocery.price * orderItem.quantity;
//     totalPrice += itemCost;
//     orderDetails.push({
//       groceryId: grocery.id,
//       name: grocery.name,
//       price: grocery.price,
//       quantity: orderItem.quantity
//     });
//   }
//   // Create the order object
//   const newOrder: Order = {
//     id: uuidv4(),
//     items: orderDetails,
//     totalPrice
//   };
//   orders.push(newOrder);
//   return res.status(201).json({
//     message: 'Order created successfully',
//     order: newOrder
//   });
// });
// export default userRouter;
// src/routes/userRoutes.ts
const express_1 = require("express");
const data_source_1 = require("../data-source");
const GroceryItem_1 = require("../entities/GroceryItem");
const Order_1 = require("../entities/Order");
const OrderItem_1 = require("../entities/OrderItem");
const userRouter = (0, express_1.Router)();
const groceryRepo = data_source_1.AppDataSource.getRepository(GroceryItem_1.GroceryItem);
const orderRepo = data_source_1.AppDataSource.getRepository(Order_1.Order);
const orderItemRepo = data_source_1.AppDataSource.getRepository(OrderItem_1.OrderItem);
/**
 * View the list of available grocery items
 */
userRouter.get('/grocery', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // inventory > 0
        const availableItems = yield groceryRepo.find({
            where: { inventory: 0 },
        });
        // We want items with inventory > 0, so we can use a "NOT" approach:
        const qb = groceryRepo.createQueryBuilder('grocery');
        qb.where('grocery.inventory > :inv', { inv: 0 });
        const items = yield qb.getMany();
        return res.json({ message: 'Available grocery items', data: items });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}));
/**
 * Book multiple grocery items in a single order
 */
userRouter.post('/order', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Invalid order data' });
    }
    // We'll do everything inside a transaction for correctness:
    const queryRunner = data_source_1.AppDataSource.createQueryRunner();
    yield queryRunner.connect();
    yield queryRunner.startTransaction();
    try {
        let totalPrice = 0;
        const orderItems = [];
        for (const orderItemReq of items) {
            const grocery = yield queryRunner.manager.findOne(GroceryItem_1.GroceryItem, {
                where: { id: orderItemReq.groceryId },
            });
            if (!grocery) {
                throw new Error(`Grocery item not found: ${orderItemReq.groceryId}`);
            }
            if (grocery.inventory < orderItemReq.quantity) {
                throw new Error(`Not enough inventory for item: ${grocery.name}`);
            }
            // Deduct inventory
            grocery.inventory -= orderItemReq.quantity;
            yield queryRunner.manager.save(grocery);
            // Create order item
            const itemCost = grocery.price * orderItemReq.quantity;
            totalPrice += itemCost;
            const newOrderItem = queryRunner.manager.create(OrderItem_1.OrderItem, {
                quantity: orderItemReq.quantity,
                grocery,
            });
            yield queryRunner.manager.save(newOrderItem);
            orderItems.push(newOrderItem);
        }
        // Create the order
        const newOrder = queryRunner.manager.create(Order_1.Order, {
            items: orderItems,
            totalPrice,
        });
        yield queryRunner.manager.save(newOrder);
        // Commit the transaction
        yield queryRunner.commitTransaction();
        return res.status(201).json({
            message: 'Order created successfully',
            order: {
                id: newOrder.id,
                items: orderItems.map((oi) => ({
                    groceryId: oi.grocery.id,
                    name: oi.grocery.name,
                    price: oi.grocery.price,
                    quantity: oi.quantity,
                })),
                totalPrice: newOrder.totalPrice,
            },
        });
    }
    catch (err) {
        // Roll back changes on error
        yield queryRunner.rollbackTransaction();
        console.error(err);
        if ((_a = err.message) === null || _a === void 0 ? void 0 : _a.startsWith('Not enough inventory')) {
            return res.status(400).json({ message: err.message });
        }
        if ((_b = err.message) === null || _b === void 0 ? void 0 : _b.startsWith('Grocery item not found')) {
            return res.status(400).json({ message: err.message });
        }
        return res.status(500).json({ message: 'Server error' });
    }
    finally {
        yield queryRunner.release();
    }
}));
exports.default = userRouter;
