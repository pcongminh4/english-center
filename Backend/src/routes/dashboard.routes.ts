import { Router } from "express";
import dashboardController from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/admin/overview",
  authenticate,
  authorize("ADMIN"),
  dashboardController.getAdminOverview,
);

router.get(
  "/parent/overview",
  authenticate,
  authorize("PARENT"),
  dashboardController.getParentOverview,
);

export default router;
