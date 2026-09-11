function normalizeAmountCents(value) {
  // String integer -> giữ chính xác kể cả vượt MAX_SAFE_INTEGER
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!/^-?\d+$/.test(trimmed)) {
      return null;
    }

    return trimmed;
  }

  // Number chỉ chấp nhận khi còn đảm bảo chính xác
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      return null;
    }

    return String(value);
  }

  return null;
}

function normalizeOrders(orders) {
  if (!Array.isArray(orders)) {
    return [];
  }

  const seenIds = new Set();
  const result = [];

  for (const order of orders) {
    if (!order || typeof order !== "object" || Array.isArray(order)) {
      continue;
    }

    const id =
      typeof order.id === "string"
        ? order.id.trim()
        : String(order.id ?? "").trim();

    const userId =
      typeof order.userId === "string"
        ? order.userId.trim()
        : String(order.userId ?? "").trim();

    // Bỏ record thiếu id / userId
    if (!id || !userId) {
      continue;
    }

    // Duplicate id -> giữ bản ghi đầu
    if (seenIds.has(id)) {
      continue;
    }

    const amountCents = normalizeAmountCents(order.amountCents);

    if (amountCents === null) {
      continue;
    }

    seenIds.add(id);

    result.push({
      ...structuredClone(order),
      id,
      userId,
      status:
        typeof order.status === "string"
          ? order.status.trim()
          : order.status,
      amountCents,
      tags: Array.isArray(order.tags)
        ? order.tags.map((tag) =>
            typeof tag === "string" ? tag.trim() : tag
          )
        : [],
    });
  }
  return result;
}

function summarizePaidByUser(orders) {
  const normalizedOrders = normalizeOrders(orders);

  const summary = new Map();

  for (const order of normalizedOrders) {
    if (order.status !== "paid") {
      continue;
    }

    const current = summary.get(order.userId) ?? 0n;

    summary.set(
      order.userId,
      current + BigInt(order.amountCents)
    );
  }

  return [...summary.entries()]
    .map(([userId, totalCents]) => ({
      userId,
      // BigInt không JSON.stringify trực tiếp được
      totalCents: totalCents.toString(),
    }))
    .sort((a, b) => {
      const totalA = BigInt(a.totalCents);
      const totalB = BigInt(b.totalCents);

      if (totalA > totalB) return -1;
      if (totalA < totalB) return 1;

      // Tie-break userId tăng dần
      return a.userId.localeCompare(b.userId);
    });
}

export {
  normalizeOrders,
  summarizePaidByUser,
};