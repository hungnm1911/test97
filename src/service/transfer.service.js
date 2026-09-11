const MAX_RETRIES = 3;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) =>
  error.code === "ER_LOCK_DEADLOCK" ||
  error.code === "ER_LOCK_WAIT_TIMEOUT";

async function transferMoney(pool, fromId, toId, amount) {
  if (fromId === toId) {
    throw new Error("Không thể chuyển tiền cho cùng một tài khoản");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Số tiền không hợp lệ");
  }

  // retry số lần giới hạn nếu deadlock / lock timeout xảy ra
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Xác định thứ tự lock để tránh deadlock
      const firstId = Math.min(fromId, toId);
      const secondId = Math.max(fromId, toId);

      const [accounts] = await connection.query(
        `
          SELECT id
          FROM accounts
          WHERE id IN (?, ?)
          ORDER BY id
          FOR UPDATE
        `,
        [firstId, secondId],
      );

      if (accounts.length !== 2) {
        throw new Error("Không tìm thấy tài khoản");
      }

      // trừ tiền từ người gửi
      const [debitResult] = await connection.query(
        `
          UPDATE accounts
          SET balance = balance - ?
          WHERE id = ?
            AND balance >= ?
        `,
        [amount, fromId, amount],
      );

      if (debitResult.affectedRows !== 1) {
        throw new Error("Số dư không đủ");
      }

      // Cộng tiền cho người nhận.
      const [creditResult] = await connection.query(
        `
          UPDATE accounts
          SET balance = balance + ?
          WHERE id = ?
        `,
        [amount, toId],
      );

      if (creditResult.affectedRows !== 1) {
        throw new Error("Không thể cập nhật tài khoản nhận");
      }

      await connection.commit();

      return {
        success: true,
        message: "Transfer successful",
      };
    } catch (error) {
      // rollback transaction nếu có lỗi
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }

      // retry nếu lỗi là deadlock / lock timeout và chưa vượt quá số lần retry
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        const delay =
          50 * 2 ** (attempt - 1) +
          Math.floor(Math.random() * 50);

        await sleep(delay);

        continue;
      }

      throw error;
    } finally {
      connection.release();
    }
  }

  throw new Error("Transfer failed after maximum retries");
}