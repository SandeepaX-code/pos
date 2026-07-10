export type ReceiptLine = {
  label: string;
  value?: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
};

const encoder = new TextEncoder();

function bytes(text: string) {
  return encoder.encode(text);
}

function command(values: number[]) {
  return Uint8Array.from(values);
}

function mergeBytes(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

function newline(count = 1) {
  return bytes("\n".repeat(count));
}

function textLine(line: ReceiptLine) {
  const content = line.value ? `${line.label}${line.value}` : line.label;
  const padded =
    line.align === "center"
      ? content.padStart(Math.floor((42 + content.length) / 2)).padEnd(42)
      : content;

  return bytes(padded + "\n");
}

export function buildEscPosReceipt(lines: ReceiptLine[]) {
  const parts: Uint8Array[] = [
    command([0x1b, 0x40]),
    command([0x1b, 0x61, 0x01]),
    bytes("SYZYGY RESTAURANTS\n"),
    command([0x1b, 0x61, 0x00]),
  ];

  for (const line of lines) {
    if (line.bold) {
      parts.push(command([0x1b, 0x45, 0x01]));
    }

    parts.push(textLine(line));

    if (line.bold) {
      parts.push(command([0x1b, 0x45, 0x00]));
    }
  }

  parts.push(newline(2), command([0x1d, 0x56, 0x00]));

  return mergeBytes(parts);
}
