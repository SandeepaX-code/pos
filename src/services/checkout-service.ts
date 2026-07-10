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

      let order: any = null;
      let isNewOrder = true;
      const orderNumber = `ORD-${new Date().getTime().toString().slice(-6)}`;

      // Try to find if there is an active pending order for this table
      if (parsed.tableId) {
        const tableDoc = await this.tables.findById(parsed.tableId, session);
        if (tableDoc && tableDoc.currentOrderId) {
          order = await this.orders.findById(String(tableDoc.currentOrderId), session);
          if (order && order.status === "pending") {
            isNewOrder = false;
          }
        }
      }

      if (parsed.paymentMethod === "none") {
        // --- 1. Pending (Unpaid) Order flow ---
        if (isNewOrder) {
          order = await this.orders.create(
            {
              orderNumber,
              branchId: new mongoose.Types.ObjectId(branch),
              tableId: parsed.tableId ? new mongoose.Types.ObjectId(parsed.tableId) : undefined,
              customerId: parsed.customerId ? new mongoose.Types.ObjectId(parsed.customerId) : undefined,
              waiterId: parsed.waiterId ? new mongoose.Types.ObjectId(parsed.waiterId) : undefined,
              customerName: parsed.customerName,
              waiterName: parsed.waiterName,
              tableLabel: parsed.tableLabel,
              status: "pending",
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
            session
          );
        } else if (order) {
          // Update existing pending order (append new items and recalculate)
          const existingItems = [...order.items];
          for (const newItem of parsed.items) {
            const matchIndex = existingItems.findIndex(i => String(i.productId) === String(newItem.productId));
            if (matchIndex > -1) {
              existingItems[matchIndex].quantity += newItem.quantity;
            } else {
              existingItems.push(newItem);
            }
          }

          const newSubtotal = sumLineItems(existingItems);
          const newTax = Math.round(newSubtotal * 0.08);
          const newServiceCharge = Math.round(newSubtotal * 0.05);
          const newGrandTotal = Math.max(newSubtotal - parsed.discount + newTax + newServiceCharge, 0);

          order.items = existingItems as any;
          order.subtotal = newSubtotal;
          order.tax = newTax;
          order.serviceCharge = newServiceCharge;
          order.grandTotal = newGrandTotal;
          order.notes = parsed.notes || order.notes;
          await order.save({ session });
        }

        // Create Kitchen Order so it goes to KDS queue
        const kitchenOrderDocs = await KitchenOrderModel.create(
          [
            {
              orderId: order._id,
              orderNumber: order.orderNumber,
              branchId: new mongoose.Types.ObjectId(branch),
              tableId: parsed.tableId ? new mongoose.Types.ObjectId(parsed.tableId) : undefined,
              tableLabel: parsed.tableLabel ?? "N/A",
              waiterId: parsed.waiterId ? new mongoose.Types.ObjectId(parsed.waiterId) : undefined,
              waiterName: parsed.waiterName,
              status: "pending",
              priority: parsed.priority,
              items: parsed.items, // print the newly placed items
              notes: parsed.notes,
              printedAt: new Date(),
            },
          ],
          { session }
        );
        const kitchenOrder = kitchenOrderDocs[0];

        // Update Table status to occupied
        if (parsed.tableId) {
          await this.tables.updateById(
            parsed.tableId,
            {
              status: "occupied",
              currentOrderId: order._id,
            },
            session
          );
        }

        await ActivityLogModel.create(
          [
            {
              userId: parsed.waiterId
                ? new mongoose.Types.ObjectId(parsed.waiterId)
                : undefined,
              userName: parsed.waiterName,
              action: "place-pending-order",
              entity: "Order",
              entityId: order._id,
              branchId: new mongoose.Types.ObjectId(branch),
              metadata: { grandTotal },
            },
          ],
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        const kitchenTicket = parsed.printKitchenTicket
          ? createEscPosPayload(
              buildKitchenReceiptLines({
                id: String(kitchenOrder._id),
                orderId: String(order._id),
                orderNumber: order.orderNumber,
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
          bill: null,
          payment: null,
          kitchenOrder,
          customerReceipt: null,
          kitchenTicket,
          inventoryDeduction: null,
        };
      } else {
        // --- 2. Paid / Settle Checkout flow ---
        if (isNewOrder || !order) {
          order = await this.orders.create(
            {
              orderNumber,
              branchId: new mongoose.Types.ObjectId(branch),
              tableId: parsed.tableId ? new mongoose.Types.ObjectId(parsed.tableId) : undefined,
              customerId: parsed.customerId ? new mongoose.Types.ObjectId(parsed.customerId) : undefined,
              waiterId: parsed.waiterId ? new mongoose.Types.ObjectId(parsed.waiterId) : undefined,
              cashierId: parsed.cashierId ? new mongoose.Types.ObjectId(parsed.cashierId) : undefined,
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
            session
          );
        } else {
          // Transition existing pending order to paid
          order.status = "paid";
          order.cashierId = parsed.cashierId
            ? new mongoose.Types.ObjectId(parsed.cashierId)
            : parsed.waiterId
              ? new mongoose.Types.ObjectId(parsed.waiterId)
              : undefined;
          await order.save({ session });
        }

        const bill = await this.bills.create(
          {
            invoiceNumber: `INV-${order.orderNumber}`,
            orderId: order._id,
            branchId: new mongoose.Types.ObjectId(branch),
            tableId: parsed.tableId ? new mongoose.Types.ObjectId(parsed.tableId) : undefined,
            customerId: parsed.customerId ? new mongoose.Types.ObjectId(parsed.customerId) : undefined,
            cashierId: parsed.cashierId
              ? new mongoose.Types.ObjectId(parsed.cashierId)
              : parsed.waiterId
                ? new mongoose.Types.ObjectId(parsed.waiterId)
                : undefined,
            cashierName: parsed.waiterName,
            tableLabel: parsed.tableLabel,
            customerName: parsed.customerName,
            items: order.items,
            subtotal: order.subtotal,
            discount: order.discount,
            tax: order.tax,
            serviceCharge: order.serviceCharge,
            grandTotal: order.grandTotal,
            paymentMethod: parsed.paymentMethod,
            printedAt: new Date(),
          },
          session
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
            amount: order.grandTotal,
            method: parsed.paymentMethod,
            status: "completed",
            paidAt: new Date(),
          },
          session
        );

        let kitchenOrder = await KitchenOrderModel.findOne({ orderId: order._id }).session(session);
        if (!kitchenOrder) {
          const kitchenOrderDocs = await KitchenOrderModel.create(
            [
              {
                orderId: order._id,
                orderNumber: order.orderNumber,
                branchId: new mongoose.Types.ObjectId(branch),
                tableId: parsed.tableId ? new mongoose.Types.ObjectId(parsed.tableId) : undefined,
                tableLabel: parsed.tableLabel ?? "N/A",
                waiterId: parsed.waiterId ? new mongoose.Types.ObjectId(parsed.waiterId) : undefined,
                waiterName: parsed.waiterName,
                status: "pending",
                priority: parsed.priority,
                items: parsed.items,
                notes: parsed.notes,
                printedAt: new Date(),
              },
            ],
            { session }
          );
          kitchenOrder = kitchenOrderDocs[0];
        }

        // Update Table status to cleaning and clear active order references
        if (parsed.tableId) {
          await this.tables.updateById(
            parsed.tableId,
            {
              status: "cleaning",
              billId: bill._id,
              currentOrderId: null,
            },
            session
          );
        }

        await NotificationModel.create(
          [
            {
              title: "Payment Completed",
              message: `Payment received for ${order.orderNumber}`,
              type: "payment-completed",
              severity: "info",
              branchId: new mongoose.Types.ObjectId(branch),
              metadata: { orderId: order._id, billId: bill._id },
            },
          ],
          { session }
        );

        await ActivityLogModel.create(
          [
            {
              userId: parsed.cashierId
                ? new mongoose.Types.ObjectId(parsed.cashierId)
                : parsed.waiterId
                ? new mongoose.Types.ObjectId(parsed.waiterId)
                : undefined,
              userName: parsed.waiterName,
              action: "checkout",
              entity: "Order",
              entityId: order._id,
              branchId: new mongoose.Types.ObjectId(branch),
              metadata: { paymentMethod: parsed.paymentMethod, grandTotal: order.grandTotal },
            },
          ],
          { session }
        );

        await session.commitTransaction();
        session.endSession();

        // 5. Deduct stock (outside transaction)
        let deductionResult: unknown = null;
        try {
          deductionResult = await this.inventoryService.performOrderInventoryDeduction(
            String(order._id),
            user
          );
        } catch (deductErr) {
          console.error("Inventory deduction failed:", deductErr);
        }

        const customerReceipt = parsed.printCustomerReceipt
          ? createEscPosPayload(
              buildCustomerReceiptLines(
                {
                  id: String(order._id),
                  orderNumber: order.orderNumber,
                  tableLabel: parsed.tableLabel,
                  waiterName: parsed.waiterName,
                  customerName: parsed.customerName,
                  status: "paid",
                  items: order.items,
                  subtotal: order.subtotal,
                  discount: order.discount,
                  tax: order.tax,
                  serviceCharge: order.serviceCharge,
                  grandTotal: order.grandTotal,
                  createdAt: new Date().toISOString(),
                  priority: parsed.priority,
                  notes: parsed.notes,
                },
                parsed.paymentMethod,
              ),
            )
          : null;

        const kitchenTicket = parsed.printKitchenTicket && isNewOrder
          ? createEscPosPayload(
              buildKitchenReceiptLines({
                id: String(kitchenOrder._id),
                orderId: String(order._id),
                orderNumber: order.orderNumber,
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
      }
    } catch (err) {
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
