import express from "express";
import {
  retrieveSmartbuildJob,
  createOrEditSmartbuildJob,
  updateOpportunityAction,
  getOpportunityCustomFields,
} from "../controllers/actionsController.js";
const router = express.Router();

router.get("/retrieve-smartbuild-job", retrieveSmartbuildJob);
router.post("/create-or-edit-smartbuild-job", createOrEditSmartbuildJob);
router.post("/update-opportunity", updateOpportunityAction);
router.post("/opportunity-custom-fields", getOpportunityCustomFields);

export default router;
