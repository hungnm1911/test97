import AppError from "../util/app-error.js";
import { getUserById } from "./user.service.js";
import { fetchScore } from "./score.service.js";
import {
  getValidScoreCache,
  saveScoreCache,
} from "./score-cache.service.js";

export async function getUserSummary(userId) {
  const user = await getUserById(userId);

  try {
    // gọi provider
    const scoreResult = await fetchScore(userId);

    // provider thành công -> cập nhật cache
    saveScoreCache(userId, scoreResult.score);

    return {
      user,
      score: scoreResult.score,
      meta: {
        degraded: false,
        stale: false,
      },
    };
  } catch (error) {
    // provider đã retry nhưng vẫn lỗi
    const cachedScore = getValidScoreCache(userId);

    if (cachedScore !== null) {
      return {
        user,
        score: cachedScore,
        meta: {
          degraded: true,
          stale: true,
        },
      };
    }

    // provider lỗi + không có cache
    throw new AppError(503, "Score service unavailable");
  }
}