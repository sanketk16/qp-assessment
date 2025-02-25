// // src/routes/adminRoutes.ts
// import { Router, Request, Response } from 'express';
// import { v4 as uuidv4 } from 'uuid';
// import { groceryItems } from '../data/groceryData';
// import { GroceryItem } from '../models/GroceryItem';

// const adminRouter = Router();

// /**
//  * Add new grocery items
//  */
// adminRouter.post('/grocery', (req: Request, res: Response) => {
//   const { name, price, inventory } = req.body;

//   if (!name || price === undefined || inventory === undefined) {
//     return res.status(400).json({ message: 'Invalid body parameters.' });
//   }

//   const newGrocery: GroceryItem = {
//     id: uuidv4(),
//     name,
//     price,
//     inventory
//   };

//   groceryItems.push(newGrocery);
//   return res.status(201).json({ message: 'Grocery item added', data: newGrocery });
// });

// /**
//  * View existing grocery items
//  */
// adminRouter.get('/grocery', (req: Request, res: Response) => {
//   return res.json({ message: 'All grocery items', data: groceryItems });
// });

// /**
//  * Remove grocery items from the system
//  */
// adminRouter.delete('/grocery/:id', (req: Request, res: Response) => {
//   const { id } = req.params;
//   const index = groceryItems.findIndex(item => item.id === id);

//   if (index === -1) {
//     return res.status(404).json({ message: 'Grocery item not found' });
//   }

//   const removedItem = groceryItems[index];
//   groceryItems.splice(index, 1);
//   return res.json({ message: 'Grocery item removed', data: removedItem });
// });

// /**
//  * Update details (e.g., name, price) of existing grocery items
//  */
// adminRouter.patch('/grocery/:id', (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { name, price } = req.body;

//   const item = groceryItems.find(g => g.id === id);
//   if (!item) {
//     return res.status(404).json({ message: 'Grocery item not found' });
//   }

//   if (name) item.name = name;
//   if (price !== undefined) item.price = price;

//   return res.json({ message: 'Grocery item updated', data: item });
// });

// /**
//  * Manage inventory levels of grocery items
//  */
// adminRouter.patch('/grocery/:id/inventory', (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { inventory } = req.body;

//   const item = groceryItems.find(g => g.id === id);
//   if (!item) {
//     return res.status(404).json({ message: 'Grocery item not found' });
//   }

//   if (inventory === undefined || inventory < 0) {
//     return res.status(400).json({ message: 'Inventory must be a non-negative number' });
//   }

//   item.inventory = inventory;
//   return res.json({ message: 'Inventory updated', data: item });
// });

// export default adminRouter;


// src/routes/adminRoutes.ts
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../data-source';
import { GroceryItem } from '../entities/GroceryItem';

const adminRouter = Router();

// Repository for GroceryItem
const groceryRepo = AppDataSource.getRepository(GroceryItem);

/**
 * Add new grocery item
 */
adminRouter.post('/grocery', async (req: Request, res: Response) => {
  try {
    const { name, price, inventory } = req.body;
    if (!name || price === undefined || inventory === undefined) {
      return res.status(400).json({ message: 'Invalid body parameters.' });
    }

    const newGrocery = groceryRepo.create({
      // id will be auto-generated by @PrimaryGeneratedColumn
      name,
      price,
      inventory,
    });

    await groceryRepo.save(newGrocery);
    return res.status(201).json({ message: 'Grocery item added', data: newGrocery });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * View all grocery items
 */
adminRouter.get('/grocery', async (req: Request, res: Response) => {
  try {
    const items = await groceryRepo.find();
    return res.json({ message: 'All grocery items', data: items });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Remove grocery item
 */
adminRouter.delete('/grocery/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await groceryRepo.findOne({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    await groceryRepo.remove(item);
    return res.json({ message: 'Grocery item removed', data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Update grocery details (name, price)
 */
adminRouter.patch('/grocery/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    const item = await groceryRepo.findOne({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    if (name) item.name = name;
    if (price !== undefined) item.price = price;

    await groceryRepo.save(item);
    return res.json({ message: 'Grocery item updated', data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * Manage inventory
 */
adminRouter.patch('/grocery/:id/inventory', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { inventory } = req.body;

    if (inventory === undefined || inventory < 0) {
      return res.status(400).json({ message: 'Inventory must be a non-negative number' });
    }

    const item = await groceryRepo.findOne({ where: { id } });
    if (!item) {
      return res.status(404).json({ message: 'Grocery item not found' });
    }

    item.inventory = inventory;
    await groceryRepo.save(item);

    return res.json({ message: 'Inventory updated', data: item });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default adminRouter;
