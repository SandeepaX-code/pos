import { buildEscPosReceipt } from "@/lib/printer/escpos";
import type { ReceiptLine } from "@/lib/printer/escpos";

export function createEscPosPayload(lines: ReceiptLine[]) {
  return Buffer.from(buildEscPosReceipt(lines));
}
