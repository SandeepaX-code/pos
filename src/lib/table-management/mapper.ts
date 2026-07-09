export function tableStatusToApi(status: string) {
  const s = status.toUpperCase();
  // mongoose enum values are snake_case like out_of_service
  if (s === "OUT_OF_SERVICE" || s === "OUT OF SERVICE") return "OUT_OF_SERVICE";
  if (s === "AVAILABLE") return "AVAILABLE";
  if (s === "OCCUPIED") return "OCCUPIED";
  if (s === "RESERVED") return "RESERVED";
  if (s === "CLEANING") return "CLEANING";
  // fall back
  if (s.includes("AVAILABLE")) return "AVAILABLE";
  if (s.includes("OCCUPIED")) return "OCCUPIED";
  if (s.includes("RESERVED")) return "RESERVED";
  if (s.includes("CLEAN")) return "CLEANING";
  return "AVAILABLE";
}

export function tableStatusFromApi(status: string) {
  // API sends AVAILABLE|OCCUPIED|RESERVED|CLEANING|OUT_OF_SERVICE
  switch (status) {
    case "AVAILABLE":
      return "available";
    case "OCCUPIED":
      return "occupied";
    case "RESERVED":
      return "reserved";
    case "CLEANING":
      return "cleaning";
    case "OUT_OF_SERVICE":
      return "out_of_service";
    default:
      return "available";
  }
}

export function toTableApiModel(table: unknown) {
  const {
    _id,
    tableNumber,
    label,
    seats,
    section,
    zone,
    floor,
    status,
    currentOrderId,
    reservationId,
    isActive,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
  } = table as {
    _id: unknown;
    tableNumber: number;
    label: string;
    seats: number;
    section?: string;
    zone?: string;
    floor?: number;
    status: string;
    currentOrderId?: unknown;
    reservationId?: unknown;
    isActive?: boolean;
    createdBy?: unknown;
    updatedBy?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  };

  return {
    id: String(_id),
    tableNumber,
    tableName: label,
    capacity: seats,
    section: section ?? zone,
    floor: floor ?? 0,
    status: tableStatusToApi(status),
    currentOrderId: currentOrderId ? String(currentOrderId) : null,
    reservationId: reservationId ? String(reservationId) : null,
    isActive: isActive ?? true,
    createdBy: createdBy ? String(createdBy) : null,
    updatedBy: updatedBy ? String(updatedBy) : null,
    createdAt,
    updatedAt,
  };
}

export function toReservationApiModel(res: unknown) {
  const r = res as {
    _id?: unknown;
    customerName?: string;
    customer?: string;
    phone?: string;
    guestCount?: number;
    partySize?: number;
    reservationDate?: string;
    reservationTime?: string;
    time?: Date | string;
    assignedTable?: unknown;
    tableId?: unknown;
    status?: string;
    notes?: string;
    createdBy?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
  };

  return {
    id: String(r._id),

    customer: r.customerName ?? r.customer,
    phone: r.phone ?? null,
    guestCount: r.guestCount ?? r.partySize,
    reservationDate:
      r.reservationDate ??
      (r.time ? new Date(r.time).toISOString().slice(0, 10) : null),
    reservationTime: r.reservationTime ?? null,
    assignedTable: r.assignedTable
      ? String(r.assignedTable)
      : r.tableId
        ? String(r.tableId)
        : null,
    status: (() => {
      const s = (r.status ?? "pending").toUpperCase();
      if (s === "CHECKED_IN" || s === "CHECKED IN") return "CHECKED_IN";
      if (s === "CANCELLED" || s === "CANCELED") return "CANCELLED";
      if (s === "COMPLETED") return "COMPLETED";
      if (s === "CONFIRMED") return "CONFIRMED";
      return "PENDING";
    })(),
    notes: r.notes ?? null,
    createdBy: r.createdBy ? String(r.createdBy) : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
