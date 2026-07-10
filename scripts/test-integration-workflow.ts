import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { TableService } from "@/services/table-service";
import { CheckoutService } from "@/services/checkout-service";
import { OrderModel } from "@/models/order";
import { ProductModel } from "@/models/product";
import { RecipeModel } from "@/models/recipe";
import { InventoryModel } from "@/models/inventory";
import { StockMovementModel } from "@/models/stock-movement";
import { KitchenOrderModel } from "@/models/kitchen-order";
import { BranchModel } from "@/models/branch";
import { UserModel } from "@/models/user";
import { RestaurantTableModel } from "@/models/restaurant-table";

async function run() {
  console.log("==================================================");
  console.log("STARTING END-TO-END WORKFLOW INTEGRATION TEST");
  console.log("==================================================");

  await connectToDatabase();

  // 1. Resolve test actor and environment
  const branch = await BranchModel.findOne().exec();
  const user = await UserModel.findOne().exec();
  const table = await RestaurantTableModel.findOne().exec();

  if (!branch || !user || !table) {
    console.error("Test prerequisites failed: Missing branch, user, or table in DB.");
    process.exit(1);
  }

  console.log(`Resolved Branch: ${branch.name} (${branch._id})`);
  console.log(`Resolved User Actor: ${user.username} (${user._id})`);
  console.log(`Resolved Target Table: ${table.label} (${table._id})`);

  // Ensure table starts available
  table.status = "available";
  table.currentOrderId = undefined;
  table.billId = undefined;
  await table.save();

  // 2. Create raw ingredient and menu products for recipe deduction
  console.log("\n--- Setting up Test Ingredient, Products, & Recipes ---");
  
  const rawIngredient = await ProductModel.create({
    name: "Test Raw Ingredient",
    sku: `SKU-RAW-${Date.now()}`,
    categoryId: new mongoose.Types.ObjectId("6a4ffad03b3a95cadfb7c0d5"), // Mock Category
    image: "/placeholder.png",
    price: 100,
    cost: 50,
    available: true,
    stock: 100,
    branchId: branch._id,
  });

  const inventory = await InventoryModel.create({
    productId: rawIngredient._id,
    name: rawIngredient.name,
    unit: "kg",
    stockOnHand: 100,
    reorderLevel: 5,
    branchId: branch._id,
  });

  console.log(`Created raw material ingredient inventory: ${inventory.name} (Stock: ${inventory.stockOnHand} ${inventory.unit})`);

  const productA = await ProductModel.create({
    name: "Test Menu Rice",
    sku: `SKU-PA-${Date.now()}`,
    categoryId: new mongoose.Types.ObjectId("6a4ffad03b3a95cadfb7c0d5"),
    image: "/placeholder.png",
    price: 1000,
    cost: 300,
    available: true,
    stock: 10,
    branchId: branch._id,
  });

  const recipeA = await RecipeModel.create({
    productId: productA._id,
    name: "Test Rice Recipe",
    yieldCount: 1,
    ingredients: [
      {
        productId: rawIngredient._id,
        name: rawIngredient.name,
        quantity: 2, // 2kg per rice
        unit: "kg",
        cost: 50,
      },
    ],
  });

  const productB = await ProductModel.create({
    name: "Test Menu Cream",
    sku: `SKU-PB-${Date.now()}`,
    categoryId: new mongoose.Types.ObjectId("6a4ffad03b3a95cadfb7c0d5"),
    image: "/placeholder.png",
    price: 500,
    cost: 150,
    available: true,
    stock: 20,
    branchId: branch._id,
  });

  const recipeB = await RecipeModel.create({
    productId: productB._id,
    name: "Test Cream Recipe",
    yieldCount: 1,
    ingredients: [
      {
        productId: rawIngredient._id,
        name: rawIngredient.name,
        quantity: 1, // 1kg per cream
        unit: "kg",
        cost: 50,
      },
    ],
  });

  const tableService = new TableService();
  const checkoutService = new CheckoutService();

  const actorUser = {
    id: String(user._id),
    role: user.role,
    fullName: user.fullName || "Test Actor",
    permissions: [],
  };

  try {
    // ==========================================
    // 1. Table Occupancy (Open Table)
    // ==========================================
    console.log("\n📌 Step 1: Open Table (Occupy Table)");
    const occupyResult = await tableService.occupyTable(String(table._id), actorUser);
    
    console.log(`Table Status Transitioned To: ${occupyResult.table.status}`);
    console.log(`Active Order ID Assigned: ${occupyResult.orderId}`);
    
    if (occupyResult.table.status !== "OCCUPIED") {
      throw new Error("Table status is not OCCUPIED after occupyTable!");
    }

    const verifyTable = await RestaurantTableModel.findById(table._id).exec();
    if (String(verifyTable?.currentOrderId) !== occupyResult.orderId) {
      throw new Error("Table currentOrderId was not successfully set in database.");
    }
    console.log("✅ Step 1 Successful!");

    // ==========================================
    // 2. Dynamic Menu Ordering (Add Items)
    // ==========================================
    console.log("\n📌 Step 2: Add Initial Course Menu Items");
    const orderId = occupyResult.orderId;

    await checkoutService.appendItemsToOrder(orderId, [
      {
        productId: String(productA._id),
        name: productA.name,
        quantity: 1, // 1 Test Menu Rice
        price: productA.price,
      },
    ]);

    let orderDoc = await OrderModel.findById(orderId).exec();
    console.log(`Initial Order Items Count: ${orderDoc?.items.length}`);
    if (orderDoc?.items.length !== 1) {
      throw new Error("Initial order items length mismatch.");
    }

    console.log("\n📌 Step 3: Add Subsequent Course Items to the Same Order");
    await checkoutService.appendItemsToOrder(orderId, [
      {
        productId: String(productB._id),
        name: productB.name,
        quantity: 2, // 2 Test Menu Cream
        price: productB.price,
      },
    ]);

    orderDoc = await OrderModel.findById(orderId).exec();
    console.log(`Updated Order Items Count: ${orderDoc?.items.length}`);
    if (orderDoc?.items.length !== 2) {
      throw new Error("Subsequent course append split the order instead of appending!");
    }
    console.log("✅ Steps 2-3 Dynamic Ordering Successful!");

    // ==========================================
    // 4. Billing & Calculations
    // ==========================================
    console.log("\n📌 Step 4: Verification of Order Math");
    const subtotal = orderDoc!.subtotal;
    const tax = orderDoc!.tax;
    const serviceCharge = orderDoc!.serviceCharge;
    const grandTotal = orderDoc!.grandTotal;

    const expectedSubtotal = 1000 * 1 + 500 * 2; // 2000 LKR
    const expectedTax = Math.round(expectedSubtotal * 0.08); // 160
    const expectedServiceCharge = Math.round(expectedSubtotal * 0.05); // 100
    const expectedGrandTotal = expectedSubtotal + expectedTax + expectedServiceCharge; // 2260

    console.log(`Calculated Subtotal: ${subtotal} LKR (Expected: ${expectedSubtotal})`);
    console.log(`Calculated Tax (8%): ${tax} LKR (Expected: ${expectedTax})`);
    console.log(`Calculated Service Charge (5%): ${serviceCharge} LKR (Expected: ${expectedServiceCharge})`);
    console.log(`Calculated Grand Total: ${grandTotal} LKR (Expected: ${expectedGrandTotal})`);

    if (subtotal !== expectedSubtotal || tax !== expectedTax || serviceCharge !== expectedServiceCharge || grandTotal !== expectedGrandTotal) {
      throw new Error("Calculation validation failed. Math does not match POS specification.");
    }
    console.log("✅ Step 4 Math Validation Successful!");

    // ==========================================
    // 5. Payment Settlement & Inventory Deduction
    // ==========================================
    console.log("\n📌 Step 5: Payment Settlement & Stock Deduction");

    const checkoutPayload = {
      branchId: String(branch._id),
      tableId: String(table._id),
      customerId: undefined,
      waiterId: String(user._id),
      waiterName: user.username,
      paymentMethod: "cash" as const,
      items: orderDoc!.items.map((i: any) => ({
        productId: String(i.productId),
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      discount: 0,
      notes: "integration test checkout",
      source: "dine-in" as const,
      priority: "normal" as const,
      printCustomerReceipt: false,
      printKitchenTicket: false,
    };

    const checkoutResult = await checkoutService.checkoutOrder(checkoutPayload, actorUser);
    console.log(`Order save state: ${checkoutResult.order.status}`);

    // Verify Table reset
    const tableAfterCheckout = await RestaurantTableModel.findById(table._id).exec();
    console.log(`Table status after checkout: ${tableAfterCheckout?.status}`);
    if (tableAfterCheckout?.status !== "cleaning") {
      throw new Error("Table did not reset to cleaning state!");
    }

    // Verify KDS Sync
    console.log("\n📌 Step 6: KDS Sync Verification");
    const kitchenOrder = await KitchenOrderModel.findOne({ orderId: checkoutResult.order._id }).exec();
    if (!kitchenOrder) {
      throw new Error("KitchenOrder document was not initialized!");
    }
    console.log(`Kitchen Order Status: ${kitchenOrder.status}`);
    console.log(`Kitchen Order Items Count: ${kitchenOrder.items.length}`);
    if (kitchenOrder.status !== "pending") {
      throw new Error("Kitchen order did not start in pending state.");
    }

    // Verify Inventory deduction
    // Product A recipe: 2kg * 1 qty = 2kg
    // Product B recipe: 1kg * 2 qty = 2kg
    // Total raw ingredient deduction: 4kg
    const inventoryAfter = await InventoryModel.findById(inventory._id).exec();
    const expectedStock = 100 - 4;
    console.log(`Inventory Stock level after sale: ${inventoryAfter?.stockOnHand} kg (Expected: ${expectedStock})`);
    if (inventoryAfter?.stockOnHand !== expectedStock) {
      throw new Error("Raw ingredients stock deduction mismatch!");
    }

    // Verify StockMovement entry
    const movement = await StockMovementModel.findOne({
      inventoryId: inventory._id,
      type: "out",
    }).exec();
    if (!movement) {
      throw new Error("No StockMovement entry was logged for the inventory deduction!");
    }
    console.log(`Logged Stock Movement Type: ${movement.type}, Qty Deducted: ${movement.quantity} kg, Reason: ${movement.reason}`);
    console.log("✅ Steps 5-6 Verification Successful!");

    console.log("\n==================================================");
    console.log("🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==================================================");

  } finally {
    // Cleanup test artifacts
    console.log("\nCleaning up test database documents...");
    await ProductModel.findByIdAndDelete(rawIngredient._id);
    await ProductModel.findByIdAndDelete(productA._id);
    await ProductModel.findByIdAndDelete(productB._id);
    await RecipeModel.findByIdAndDelete(recipeA._id);
    await RecipeModel.findByIdAndDelete(recipeB._id);
    await InventoryModel.findByIdAndDelete(inventory._id);
    
    // Reset table status to available
    await RestaurantTableModel.findByIdAndUpdate(table._id, {
      status: "available",
      currentOrderId: undefined,
      billId: undefined,
    });
    console.log("Clean up finished!");
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ INTEGRATION TEST FAILED WITH ERROR:", err);
    process.exit(1);
  });
