import express from "express";
import {
  retrieveSmartbuildJob,
  createOrEditSmartbuildJob,
  updateOpportunityAction,
  getOpportunityCustomFields,
  getSmartbuildFields,
} from "../controllers/actionsController.js";
const router = express.Router();

router.post("/retrieve-smartbuild-job", retrieveSmartbuildJob);
router.post("/create-or-edit-smartbuild-job", createOrEditSmartbuildJob);
router.post("/smartbuild-custom-fields", getSmartbuildFields);
router.post("/update-opportunity", updateOpportunityAction);
router.post("/opportunity-custom-fields", getOpportunityCustomFields);

export default router;
