import { describe, expect, it } from "vitest";

import { orders } from "../../data/restaurant";
import { createCustomerReceipt, createKitchenReceipt } from "./receipts";

describe("printer receipts", () => {
  it("creates a customer receipt payload", () => {
    const payload = createCustomerReceipt(orders[0], "card");

    expect(payload).toBeInstanceOf(Uint8Array);
    expect(payload.length).toBeGreaterThan(0);
  });

  it("creates a kitchen receipt payload", () => {
    const payload = createKitchenReceipt(orders[0]);

    expect(payload).toBeInstanceOf(Uint8Array);
    expect(payload.length).toBeGreaterThan(0);
  });
});
