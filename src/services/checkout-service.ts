import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import { OrderRepository } from "@/repositories/order-repository";
import { BillRepository } from "@/repositories/bill-repository";
import { PaymentRepository } from "@/repositories/payment-repository";
import { TableRepository } from "@/repositories/table-repository";
import { InventoryService } from "@/services/inventory-service";
import { KitchenOrderModel } from "@/models/kitchen-order";
import { NotificationModel } from "@/models/notification";
import { ActivityLogModel } from "@/models/activity-log";
import { checkoutOrderSchema } from "@/validation/domain";
import type { OrderItem } from "@/types/domain";
import {
  buildCustomerReceiptLines,
  buildKitchenReceiptLines,
} from "@/lib/printer/receipts";
import { createEscPosPayload } from "@/lib/server/receipt-bridge";

type UserActor = { id?: string; fullName?: string } | null | undefined;

function sumLineItems(items: OrderItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export class CheckoutService {
  private readonly orders = new OrderRepository();
  private readonly bills = new BillRepository();
  private readonly payments = new PaymentRepository();
  private readonly tables = new TableRepository();
  private readonly inventoryService = new InventoryService();

  async checkoutOrder(input: unknown, user?: UserActor) {
    const parsed = checkoutOrderSchema.parse(input);
    await connectToDatabase();

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Pre-check inventory availability
      const { missingItems } =
        await this.inventoryService.computeRequiredInventoryForItems(
          parsed.items,
          parsed.branchId,
        );

      if (missingItems && missingItems.length > 0) {
        const error = new Error("Insufficient inventory.") as Error & {
          missingItems?: unknown[];
        };
        error.missingItems = missingItems;
        throw error;
      }

      // 2. Calculations
      const subtotal = sumLineItems(parsed.items);
      const branch = parsed.branchId;
      const tax = Math.round(subtotal * 0.08);
      const serviceCharge = Math.round(subtotal * 0.05);
      const grandTotal = Math.max(
        subtotal - parsed.discount + tax + serviceCharge,
        0,
      );

      const orderNumber = `ORD-${new Date().getTime().toString().slice(-6)}`;

      // 3. Create documents
      const order = await this.orders.create(
        {
          orderNumber,
          branchId: new mongoose.Types.ObjectId(branch),
          tableId: parsed.tableId
            ? new mongoose.Types.ObjectId(parsed.tableId)
            : undefined,
          customerId: parsed.customerId
            ? new mongoose.Types.ObjectId(parsed.customerId)
            : undefined,
          waiterId: parsed.waiterId
            ? new mongoose.Types.ObjectId(parsed.waiterId)
            : undefined,
          cashierId: parsed.cashierId
            ? new mongoose.Types.ObjectId(parsed.cashierId)
            : undefined,
          customerName: parsed.customerName,
          waiterName: parsed.waiterName,
          tableLabel: parsed.tableLabel,
          status: "paid",
          priority: parsed.priority,
          items: parsed.items,
          subtotal,
          discount: parsed.discount,
          tax,
          serviceCharge,
          grandTotal,
          notes: parsed.notes,
          source: parsed.source,
        },
        session,
      );

      const bill = await this.bills.create(
        {
          invoiceNumber: `INV-${orderNumber}`,
          orderId: order._id,
          branchId: new mongoose.Types.ObjectId(branch),
          tableId: parsed.tableId
            ? new mongoose.Types.ObjectId(parsed.tableId)
            : undefined,
          customerId: parsed.customerId
            ? new mongoose.Types.ObjectId(parsed.customerId)
            : undefined,
          cashierId: parsed.cashierId
            ? new mongoose.Types.ObjectId(parsed.cashierId)
            : parsed.waiterId
              ? new mongoose.Types.ObjectId(parsed.waiterId)
              : undefined,
          cashierName: parsed.waiterName,
          tableLabel: parsed.tableLabel,
          customerName: parsed.customerName,
          items: parsed.items,
          subtotal,
          discount: parsed.discount,
          tax,
          serviceCharge,
          grandTotal,
          paymentMethod: parsed.paymentMethod,
          printedAt: new Date(),
        },
        session,
      );

      const payment = await this.payments.create(
        {
          orderId: order._id,
          billId: bill._id,
          branchId: new mongoose.Types.ObjectId(branch),
          cashierId: parsed.cashierId
            ? new mongoose.Types.ObjectId(parsed.cashierId)
            : parsed.waiterId
              ? new mongoose.Types.ObjectId(parsed.waiterId)
              : undefined,
          amount: grandTotal,
          method: parsed.paymentMethod,
          status: "completed",
          paidAt: new Date(),
        },
        session,
      );

      const kitchenOrderDocs = await KitchenOrderModel.create(
        [
          {
            orderId: order._id,
            orderNumber,
            branchId: new mongoose.Types.ObjectId(branch),
            tableId: parsed.tableId
              ? new mongoose.Types.ObjectId(parsed.tableId)
              : undefined,
            tableLabel: parsed.tableLabel ?? "N/A",
            waiterId: parsed.waiterId
              ? new mongoose.Types.ObjectId(parsed.waiterId)
              : undefined,
            waiterName: parsed.waiterName,
            status: "pending",
            priority: parsed.priority,
            items: parsed.items,
            notes: parsed.notes,
            printedAt: new Date(),
          },
        ],
        { session },
      );
      const kitchenOrder = kitchenOrderDocs[0];

      // 4. Update Table (Transition status to cleaning)
      if (parsed.tableId) {
        await this.tables.updateById(
          parsed.tableId,
          {
            status: "cleaning",
            billId: bill._id,
          },
          session,
        );
      }

      await NotificationModel.create(
        [
          {
            title: "Payment Completed",
            message: `Payment received for ${orderNumber}`,
            type: "payment-completed",
            severity: "info",
            branchId: new mongoose.Types.ObjectId(branch),
            metadata: { orderId: order._id, billId: bill._id },
          },
        ],
        { session },
      );

      await ActivityLogModel.create(
        [
          {
            userId: parsed.waiterId
              ? new mongoose.Types.ObjectId(parsed.waiterId)
              : undefined,
            userName: parsed.waiterName,
            action: "checkout",
            entity: "Order",
            entityId: order._id,
            branchId: new mongoose.Types.ObjectId(branch),
            metadata: { paymentMethod: parsed.paymentMethod, grandTotal },
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      // 5. Deduct stock (outside transaction — order is already committed)
      let deductionResult: unknown = null;
      try {
        deductionResult =
          await this.inventoryService.performOrderInventoryDeduction(
            String(order._id),
            user,
          );
      } catch (deductErr) {
        // Log but don't fail the checkout — order is already saved
        console.error("Inventory deduction failed (order saved):", deductErr);
      }

      const customerReceipt = parsed.printCustomerReceipt
        ? createEscPosPayload(
            buildCustomerReceiptLines(
              {
                id: String(order._id),
                orderNumber,
                tableLabel: parsed.tableLabel,
                waiterName: parsed.waiterName,
                customerName: parsed.customerName,
                status: "paid",
                items: parsed.items,
                subtotal,
                discount: parsed.discount,
                tax,
                serviceCharge,
                grandTotal,
                createdAt: new Date().toISOString(),
                priority: parsed.priority,
                notes: parsed.notes,
              },
              parsed.paymentMethod,
            ),
          )
        : null;

      const kitchenTicket = parsed.printKitchenTicket
        ? createEscPosPayload(
            buildKitchenReceiptLines({
              id: String(kitchenOrder._id),
              orderId: String(order._id),
              orderNumber,
              tableLabel: parsed.tableLabel ?? "N/A",
              waiterName: parsed.waiterName,
              status: "pending",
              items: parsed.items,
              notes: parsed.notes,
              createdAt: new Date().toISOString(),
              priority: parsed.priority,
            }),
          )
        : null;

      return {
        order,
        bill,
        payment,
        kitchenOrder,
        customerReceipt,
        kitchenTicket,
        inventoryDeduction: deductionResult,
      };
    } catch (err) {
      // Only abort if the transaction hasn't been committed yet
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw err;
    }
  }

  async appendItemsToOrder(orderId: string, newItems: OrderItem[]) {
    await connectToDatabase();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await this.orders.findById(orderId, session);
      if (!order) {
        throw new Error("Order not found");
      }

      if (order.status === "void" || order.status === "paid") {
        throw new Error("Cannot add items to a void or paid order");
      }

      // Append items to order
      const currentItems = order.items ? order.items.toObject() : [];
      const updatedItems: OrderItem[] = currentItems.map((item: any) => ({
        productId: String(item.productId),
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || undefined,
        modifiers: item.modifiers || [],
      }));

      for (const newItem of newItems) {
        const existing = updatedItems.find(
          (item) => String(item.productId) === String(newItem.productId)
        );
        if (existing) {
          existing.quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }
      }

      // Recalculate totals
      const subtotal = sumLineItems(updatedItems);
      const tax = Math.round(subtotal * 0.08);
      const serviceCharge = Math.round(subtotal * 0.05);
      const grandTotal = Math.max(
        subtotal - (order.discount || 0) + tax + serviceCharge,
        0
      );

      // Update Order
      const updatedOrder = await this.orders.updateById(
        orderId,
        {
          items: updatedItems,
          subtotal,
          tax,
          serviceCharge,
          grandTotal,
        },
        session
      );

      // Update Kitchen Order items as well (if KDS needs update)
      const kitchenOrder = await KitchenOrderModel.findOne({ orderId }, null, { session });
      if (kitchenOrder) {
        kitchenOrder.items = updatedItems as any;
        await kitchenOrder.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      return updatedOrder;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async listBills(filter: Record<string, unknown> = {}) {
    await connectToDatabase();
    return this.bills.list(filter);
  }

  async getBillById(id: string) {
    await connectToDatabase();
    const bill = await this.bills.findLeanById(id);
    if (!bill) {
      throw new Error("Bill not found");
    }
    return bill;
  }
}
