import { Router } from "express";

import { 
  // getUser, 
  getUserSummaryController 
} from "../controller/user.controller.js";
import validateUserId from "../middleware/validate-user-id.middleware.js";

const router = Router();

// router.get("/:id", validateUserId, getUser);

router.get(
  "/:id/summary",
  validateUserId,
  getUserSummaryController,
);

export default router;