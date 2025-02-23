import {
  DEFAULT_JOB_INFO_IDS,
  DEFAULT_JOB_TOKEN_VALUES,
} from "../constants/smartbuildAttributeDefaults.js";
import { getJobData } from "../services/smartbuildService.js";
import { getOpportunity, updateOpportunity } from "../services/ghlService.js";
import { getAuthenticatedLocation } from "../services/authService.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import { retrieveOpportunityData } from "../services/ghlActionRequestHandler.js";

export const updateOpportunityAction = async (req, res) => {
  const { locationId, opportunityID, opportunityData } =
    retrieveOpportunityData(req.body);

  const authenticatedLocation = await getAuthenticatedLocation(locationId);
  const result = await updateOpportunity(
    authenticatedLocation.accessToken,
    opportunityID,
    opportunityData
  );

  return res.status(200).json(result);
};

export const getOpportunityTest = async (req, res, next) => {
  const { opportunityId, locationId } = req.query;
  if (!opportunityId || !locationId) {
    throw new AppError(
      "No opportunity id or location id provided",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  const authenticatedLocation = await getAuthenticatedLocation(locationId);
  const opportunity = await getOpportunity(
    authenticatedLocation.accessToken,
    opportunityId
  );
  return res.status(200).json(opportunity);
};

export const getOpportunityCustomFields = async (req, res, next) => {
  const { locationId } = req.body.extras;
  if (!locationId) {
    throw new AppError("No location id provided", 400, ErrorCodes.BAD_REQUEST);
  }

  const authenticatedLocation = await getAuthenticatedLocation(locationId);
  const customFields = await getOpportunityCustomFields(
    authenticatedLocation.accessToken,
    locationId
  );
  return res
    .status(200)
    .json({ inputs: [{ section: "Custom Fields", fields: customFields }] });
};

export const retrieveSmartbuildJob = async (req, res) => {
  const { smartbuildJobId, smartbuildUserId, smartbuildUserPassword } =
    req.query;
  const jobInfoIds = req.query.jobInfoIds || DEFAULT_JOB_INFO_IDS;
  const jobTokenValues = req.query.jobTokenValues || DEFAULT_JOB_TOKEN_VALUES;

  if (!smartbuildJobId || !smartbuildUserId || !smartbuildUserPassword)
    return res.status(400).json({
      error: "No sb job id, sb user id, or sb user password provided",
    });

  try {
    const accessToken = await getAccessToken(
      smartbuildUserId,
      smartbuildUserPassword
    );
    const jobData = await getJobData(
      accessToken,
      smartbuildJobId,
      jobInfoIds,
      jobTokenValues
    );
    return res.status(200).json(jobData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrEditSmartbuildJob = async (req, res) => {
  const { smartbuildJobId, smartbuildUserId, smartbuildUserPassword } =
    req.query;
  if (!smartbuildJobId || !smartbuildUserId || !smartbuildUserPassword)
    return res.status(400).json({
      error: "No sb job id, sb user id, or sb user password provided",
    });

  try {
    //await authenticateAndSaveUser(code);
    return res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
