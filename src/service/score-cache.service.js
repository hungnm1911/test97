const scoreCache = new Map();

export function saveScoreCache(userId, score) {
  scoreCache.set(userId, {
    score,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

export function getValidScoreCache(userId) {
  const cached = scoreCache.get(userId);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    scoreCache.delete(userId);
    return null;
  }

  return cached.score;
}