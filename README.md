# qp-assessment
Technical Assessment Submission Application ID : 29560155. Design a Grocery Booking API.

This API allows admins to manage grocery items (add, view, update, delete, and adjust inventory), and users to place orders for multiple grocery items.

Relational database used: TypeORM.

This project uses TypeORM. By default, it’s configured to use SQLite (see data-source.ts). 

# API Endpoints
## Admin Routes
All admin routes are prefixed with /admin.

### 1. Add New Grocery Item

POST /admin/grocery: Creates a new grocery item in the database.

Body:

  {
    "name": "Banana",
    "price": 1.99,
    "inventory": 100
  }

### 2. View All Grocery Items

GET /admin/grocery: Returns all grocery items, including those with zero inventory.

### 3. Remove Grocery Item

DELETE /admin/grocery/:id: Removes the specified grocery item (by :id).

### 4. Update Grocery Details

PATCH /admin/grocery/:id: Updates name and/or price of the specified item.

Body:

{
  "name": "Organic Banana",
  "price": 2.5
}

### 5. Update Inventory

PATCH /admin/grocery/:id/inventory: Updates only the inventory of the specified item.

Body:

{
  "inventory": 150
}

## User Routes

### 1. List Available Grocery Items

GET /user/grocery: Returns items where inventory > 0.

### 2. Create an Order

POST /user/order: - Decrements inventory for each grocery item and creates an Order record along with associated OrderItem records.
                  - If any item has insufficient inventory, the entire order is rolled back (transaction).

Body:

{
  "items": [
  { "groceryId": "abc123-4b56-7890-efgh", "quantity": 3 },
  { "groceryId": "xyz987-0a12-3456-bcde", "quantity": 2 }
 ]
}

## Data Models (Entities)

### GroceryItem

Fields: id, name, price, inventory
Relationship: has many OrderItems

### Order

Fields: id, totalPrice
Relationship: has many OrderItems (via cascade)

### OrderItem

Fields: id, quantity
Relationships: belongs to one Order, belongs to one GroceryItem

These entities are automatically mapped to database tables via TypeORM. See src/entities/ folder.

