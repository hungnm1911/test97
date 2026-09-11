const { userId, date } = req.query;

// date = "2026-09-10"
// from = "2026-09-10 00:00:00"
const from = `${date} 00:00:00`;

const toDate = new Date(`${date}T00:00:00Z`);
toDate.setUTCDate(toDate.getUTCDate() + 1);

// to   = "2026-09-11 00:00:00"
const to = toDate
  .toISOString()
  .slice(0, 19)
  .replace("T", " ");

const [rows] = await db.query(
  `  
    SELECT id, user_id, total_amount, status, created_at
    FROM orders
    WHERE user_id = ?
      AND created_at >= ?
      AND created_at < ?
    ORDER BY created_at DESC
  `, 
  [
    userId,
    from,
    to,
  ]
);