import AppError from "../util/app-error.js";

export default function validateUserId(req, res, next) {
  const { id } = req.params;

  if (!/^\d+$/.test(id)) {
    return next(new AppError(400, "Invalid user id"));
  }

  const userId = Number(id);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return next(new AppError(400, "Invalid user id"));
  }

  req.userId = userId;

  next();
}