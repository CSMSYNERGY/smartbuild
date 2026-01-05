//webApiRoutes.js
import express from "express";
import {
  getWebUserController,
  getPlansController,
  createSubscriptionController,
  cancelSubscriptionController,
  updatePaymentController,
  checkLocationAuthorizationController,
  authenticateSmartbuildController,
  getSmartbuildConfigurationnController,
  getMappersController,
  getMapperController,
  createMapperController,
  updateMapperController,
  deleteMapperController,
} from "../controllers/webApiController.js";
const router = express.Router();

router.get("/me", getWebUserController);
router.get("/subscription/plans", getPlansController);
router.get(
  "/location/check-authorization",
  checkLocationAuthorizationController
);
router.post(
  "/location/smartbuild/authenticate",
  authenticateSmartbuildController
);
router.get(
  "/location/smartbuild/configuration",
  getSmartbuildConfigurationnController
);
router.post("/subscription/create", createSubscriptionController);
router.post("/subscription/cancel", cancelSubscriptionController);
router.post("/subscription/update-payment", updatePaymentController);

router.get("/mappers", getMappersController);
router.post("/mappers", createMapperController);
router.get("/mappers/:mapperId", getMapperController);
router.put("/mappers/:mapperId", updateMapperController);
router.delete("/mappers/:mapperId", deleteMapperController);
export default router;
