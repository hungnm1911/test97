import {
  normalizeOrders,
  summarizePaidByUser,
} from "../service/order.js";

describe("normalizeOrders", () => {
  test("empty input", () => {
    expect(normalizeOrders([])).toEqual([]);
  });

  test("remove invalid records", () => {
    const orders = [
      { id: "", userId: "u1", amountCents: "100" },
      { id: "1", userId: "", amountCents: "100" },
      { id: "2", userId: "u2", amountCents: "abc" },
    ];

    expect(normalizeOrders(orders)).toEqual([]);
  });

  test("remove duplicate id and keep first record", () => {
    const orders = [
      {
        id: "1",
        userId: "u1",
        amountCents: "100",
        status: "paid",
      },
      {
        id: "1",
        userId: "u2",
        amountCents: "500",
        status: "paid",
      },
    ];

    const result = normalizeOrders(orders);

    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe("u1");
  });

  test("does not mutate nested input", () => {
    const orders = [
      {
        id: " 1 ",
        userId: " u1 ",
        amountCents: "100",
        status: " paid ",
        tags: [" vip "],
        meta: {
          source: "web",
        },
      },
    ];

    const original = structuredClone(orders);

    const result = normalizeOrders(orders);

    result[0].meta.source = "mobile";

    expect(orders).toEqual(original);

    expect(result[0].id).toBe("1");
    expect(result[0].userId).toBe("u1");
    expect(result[0].status).toBe("paid");
    expect(result[0].tags).toEqual(["vip"]);
  });
});

describe("summarizePaidByUser", () => {
  test("only sum paid orders", () => {
    const orders = [
      {
        id: "1",
        userId: "u1",
        amountCents: "100",
        status: "paid",
      },
      {
        id: "2",
        userId: "u1",
        amountCents: "500",
        status: "pending",
      },
      {
        id: "3",
        userId: "u2",
        amountCents: "200",
        status: "paid",
      },
    ];

    expect(summarizePaidByUser(orders)).toEqual([
      {
        userId: "u2",
        totalCents: "200",
      },
      {
        userId: "u1",
        totalCents: "100",
      },
    ]);
  });

  test("support amount greater than MAX_SAFE_INTEGER", () => {
    const orders = [
      {
        id: "1",
        userId: "u1",
        amountCents: "9007199254740993",
        status: "paid",
      },
      {
        id: "2",
        userId: "u1",
        amountCents: "10",
        status: "paid",
      },
    ];

    expect(summarizePaidByUser(orders)).toEqual([
      {
        userId: "u1",
        totalCents: "9007199254741003",
      },
    ]);
  });

  test("tie-break by userId ascending", () => {
    const orders = [
      {
        id: "1",
        userId: "u2",
        amountCents: "100",
        status: "paid",
      },
      {
        id: "2",
        userId: "u1",
        amountCents: "100",
        status: "paid",
      },
    ];

    expect(summarizePaidByUser(orders)).toEqual([
      {
        userId: "u1",
        totalCents: "100",
      },
      {
        userId: "u2",
        totalCents: "100",
      },
    ]);
  });
});