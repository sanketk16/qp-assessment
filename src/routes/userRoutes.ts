// // src/routes/userRoutes.ts
// import { Router, Request, Response } from 'express';
// import { v4 as uuidv4 } from 'uuid';
// import { groceryItems } from '../data/groceryData';
// import { orders } from '../data/orderData';
// import { Order, OrderItem, OrderDetail } from '../models/Order';

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
import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { GroceryItem } from '../entities/GroceryItem';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';

const userRouter = Router();

const groceryRepo = AppDataSource.getRepository(GroceryItem);
const orderRepo = AppDataSource.getRepository(Order);
const orderItemRepo = AppDataSource.getRepository(OrderItem);

/**
 * View the list of available grocery items
 */
userRouter.get('/grocery', async (req: Request, res: Response) => {
  try {
    // inventory > 0
    const availableItems = await groceryRepo.find({
      where: { inventory: 0 },
    });

    // We want items with inventory > 0, so we can use a "NOT" approach:
    const qb = groceryRepo.createQueryBuilder('grocery');
    qb.where('grocery.inventory > :inv', { inv: 0 });

    const items = await qb.getMany();
    return res.json({ message: 'Available grocery items', data: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Book multiple grocery items in a single order
 */
userRouter.post('/order', async (req: Request, res: Response) => {
  const { items } = req.body as {
    items: Array<{ groceryId: string; quantity: number }>;
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Invalid order data' });
  }

  // We'll do everything inside a transaction for correctness:
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    let totalPrice = 0;
    const orderItems: OrderItem[] = [];

    for (const orderItemReq of items) {
      const grocery = await queryRunner.manager.findOne(GroceryItem, {
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
      await queryRunner.manager.save(grocery);

      // Create order item
      const itemCost = grocery.price * orderItemReq.quantity;
      totalPrice += itemCost;

      const newOrderItem = queryRunner.manager.create(OrderItem, {
        quantity: orderItemReq.quantity,
        grocery,
      });
      await queryRunner.manager.save(newOrderItem);
      orderItems.push(newOrderItem);
    }

    // Create the order
    const newOrder = queryRunner.manager.create(Order, {
      items: orderItems,
      totalPrice,
    });
    await queryRunner.manager.save(newOrder);

    // Commit the transaction
    await queryRunner.commitTransaction();

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
  } catch (err: any) {
    // Roll back changes on error
    await queryRunner.rollbackTransaction();
    console.error(err);

    if (err.message?.startsWith('Not enough inventory')) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message?.startsWith('Grocery item not found')) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: 'Server error' });
  } finally {
    await queryRunner.release();
  }
});

export default userRouter;
