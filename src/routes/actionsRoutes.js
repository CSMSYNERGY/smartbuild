import express from "express";
import {
  retrieveSmartbuildJob,
  createOrEditSmartbuildJob,
  updateOpportunityAction,
  getOpportunityCustomFields,
  getSmartbuildFields,
  getMapperValue,
  getMappers,
  updateMapper,
} from "../controllers/actionsController.js";
const router = express.Router();

router.post("/retrieve-smartbuild-job", retrieveSmartbuildJob);
router.post("/create-or-edit-smartbuild-job", createOrEditSmartbuildJob);
router.post("/smartbuild-custom-fields", getSmartbuildFields);
router.post("/update-opportunity", updateOpportunityAction);
router.post("/opportunity-custom-fields", getOpportunityCustomFields);
router.post("/get-mapper-value", getMapperValue);
router.post("/update-mapper", updateMapper);
router.get("/get-mappers", getMappers);

export default router;
