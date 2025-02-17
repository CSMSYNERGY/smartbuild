import express from "express";
import {
  retrieveSmartbuildJob,
  createOrEditSmartbuildJob,
  updateOpportunity,
} from "../controllers/actionsController.js";

const router = express.Router();

router.get("/retrieve-smartbuild-job", retrieveSmartbuildJob);
router.post("/create-or-edit-smartbuild-job", createOrEditSmartbuildJob);
router.put("/update-opportunity", updateOpportunity);

export default router;
