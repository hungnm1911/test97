async function transferMoney(db, fromId, toId, amount) {
  await db.beginTransaction();

  try {
    const [rows] = await db.query(
      "SELECT balance FROM accounts WHERE id = ?",
      [fromId]
    );

    const from = rows[0];

    if (!from || from.balance < amount) {
      throw new Error("Số dư không đủ");
    }

    // UPDATE này sẽ lock account fromId
    await db.query(
      "UPDATE accounts SET balance = balance - ? WHERE id = ?",
      [amount, fromId]
    );

    // Nếu một transaction khác đang giữ lock của toId,
    // transaction này sẽ phải chờ ở đây.
    await db.query(
      "UPDATE accounts SET balance = balance + ? WHERE id = ?",
      [amount, toId]
    );

    await db.commit();
  } catch (error) {
    await db.rollback();
    throw error;
  }
}