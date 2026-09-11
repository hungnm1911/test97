import pool from "../config/database.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

/**
 * amount dùng dạng string:
 * "100"
 * "100.50"
 * "125000.25"
 *
 * Không cộng/trừ tiền bằng Number trong JavaScript.
 */
const validateTransferInput = (fromId, toId, amount) => {
  if (
    !Number.isInteger(fromId)
    || !Number.isInteger(toId)
    || fromId <= 0
    || toId <= 0
  ) {
    throw new Error("Invalid account id");
  }

  if (fromId === toId) {
    throw new Error("Source and destination accounts must be different");
  }

  const amountString = String(amount);

  if (!MONEY_PATTERN.test(amountString)) {
    throw new Error("Invalid amount");
  }

  // Loại 0, 0.0, 0.00
  if (/^0(?:\.0{1,2})?$/.test(amountString)) {
    throw new Error("Amount must be greater than 0");
  }

  return amountString;
};


/**
 * Chuyển tiền từ fromId -> toId.
 */
export const transfer = async (fromId, toId, amount) => {
  const transferAmount = validateTransferInput(
    fromId,
    toId,
    amount,
  );

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /*
     * Luôn lock account theo cùng một thứ tự ID.
     *
     * VD:
     * transfer(10 -> 20) lock 10 rồi 20
     * transfer(20 -> 10) vẫn lock 10 rồi 20
     *
     * Nhờ vậy tránh trường hợp:
     * Transaction A giữ 10, chờ 20
     * Transaction B giữ 20, chờ 10
     */
    const firstAccountId = Math.min(fromId, toId);
    const secondAccountId = Math.max(fromId, toId);

    const [firstRows] = await connection.execute(
      `
        SELECT id
        FROM accounts
        WHERE id = ?
        FOR UPDATE
      `,
      [firstAccountId],
    );

    if (firstRows.length === 0) {
      throw new Error(`Account ${firstAccountId} not found`);
    }

    const [secondRows] = await connection.execute(
      `
        SELECT id
        FROM accounts
        WHERE id = ?
        FOR UPDATE
      `,
      [secondAccountId],
    );

    if (secondRows.length === 0) {
      throw new Error(`Account ${secondAccountId} not found`);
    }

    /*
     * Trừ tiền.
     *
     * Điều kiện balance >= ? bảo đảm balance không âm.
     *
     * Phép trừ được MySQL thực hiện trực tiếp trên DECIMAL,
     * không đưa balance ra JavaScript để tính toán.
     */
    const [debitResult] = await connection.execute(
      `
        UPDATE accounts
        SET balance = balance - ?
        WHERE id = ?
          AND balance >= ?
      `,
      [
        transferAmount,
        fromId,
        transferAmount,
      ],
    );

    if (debitResult.affectedRows !== 1) {
      throw new Error("Insufficient balance");
    }

    /*
     * Cộng tiền cho tài khoản nhận.
     */
    const [creditResult] = await connection.execute(
      `
        UPDATE accounts
        SET balance = balance + ?
        WHERE id = ?
      `,
      [
        transferAmount,
        toId,
      ],
    );

    if (creditResult.affectedRows !== 1) {
      throw new Error("Destination account not found");
    }

    await connection.commit();

    return {
      fromId,
      toId,
      amount: transferAmount,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};


/**
 * Lấy 20 đơn mới nhất của user trong khoảng ngày.
 *
 * fromDate, toDate:
 * "2026-09-01"
 * "2026-09-10"
 *
 * toDate được tính inclusive toàn bộ ngày.
 */
export const getLatestOrders = async (
  userId,
  fromDate,
  toDate,
) => {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("Invalid user id");
  }

  if (
    !DATE_PATTERN.test(fromDate)
    || !DATE_PATTERN.test(toDate)
  ) {
    throw new Error("Invalid date");
  }

  const [rows] = await pool.execute(
    `
      SELECT
        id,
        user_id,
        total_amount,
        created_at
      FROM orders
      WHERE user_id = ?
        AND created_at >= ?
        AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY created_at DESC
      LIMIT 20
    `,
    [
      userId,
      fromDate,
      toDate,
    ],
  );

  return rows;
};