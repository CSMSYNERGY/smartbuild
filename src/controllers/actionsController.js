import {
  DEFAULT_JOB_INFO_IDS,
  DEFAULT_JOB_TOKEN_VALUES,
} from "../constants/smartbuildAttributeDefaults.js";
import {
  createOrEditJob,
  getJobData,
  getSmartbuildToken,
  retrieveSmartbuildCustomFields,
} from "../services/smartbuildService.js";
import {
  getOpportunity,
  retrieveOpportunityCustomFields,
  updateOpportunity,
} from "../services/ghlService.js";
import {
  getAuthenticatedLocation,
  getAuthenticatedSmartbuild,
} from "../services/authService.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import { retrieveOpportunityData } from "../services/ghlActionRequestHandler.js";

export const updateOpportunityAction = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);
  const { opportunityID, opportunityData } = retrieveOpportunityData(req.body);

  const authenticatedLocation = await getAuthenticatedLocation(locationId);
  await updateOpportunity(
    authenticatedLocation.accessToken,
    opportunityID,
    opportunityData
  );

  return res.status(200).send();
};

export const getOpportunityAction = async (req, res, next) => {
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
  const locationId = getLocationIdFromRequest(req);

  const authenticatedLocation = await getAuthenticatedLocation(locationId);
  const customFields = await retrieveOpportunityCustomFields(
    authenticatedLocation.accessToken,
    locationId
  );
  return res
    .status(200)
    .json({ inputs: [{ section: "Custom Fields", fields: customFields }] });
};

export const getSmartbuildFields = async (req, res, next) => {
  const locationId = getLocationIdFromRequest(req);

  const authenticatedSmartbuild = await getAuthenticatedSmartbuild(locationId);

  const customFields = await retrieveSmartbuildCustomFields(
    authenticatedSmartbuild.accessToken
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
  const locationId = getLocationIdFromRequest(req);
  const { isCreate, modelID, jobID } = getCreateOrEditJobMetaData(req.body);
  const smartbuildAuthentication = await getSmartbuildAuthentication(
    req.body,
    locationId
  );
  const cleanedBody = removeProcessedKeys(req.body);

  const updatedOrCreatedJob = await createOrEditJob(
    smartbuildAuthentication.accessToken,
    isCreate ? "0" : jobID,
    modelID,
    cleanedBody
  );
  return res.status(200).json(updatedOrCreatedJob);
};

const getLocationIdFromRequest = (req) => {
  const locationId = req.headers["locationid"] || req.query.locationId;
  if (!locationId) {
    throw new AppError("No location id provided", 400, ErrorCodes.BAD_REQUEST);
  }
  return locationId;
};

const getCreateOrEditJobMetaData = (body) => {
  const isCreate = !body.jobID || body.jobID === "0";

  if (isCreate) {
    // For create requests, modelID must be present
    if (!body.modelID) {
      throw new AppError(
        "ModelID is required for creating a new job",
        400,
        ErrorCodes.BAD_REQUEST
      );
    }
    return {
      isCreate: true,
      modelID: body.modelID,
      jobID: "0",
    };
  }

  return {
    isCreate: false,
    modelID: null, // modelID is ignored for edit requests
    jobID: body.jobID,
  };
};

const removeProcessedKeys = (body) => {
  const updatedBody = { ...body };

  delete updatedBody.jobID;
  delete updatedBody.modelID;
  delete updatedBody.username;
  delete updatedBody.password;
  return updatedBody;
};

const getSmartbuildAuthentication = async (body, locationId) => {
  const { username, password } = body;

  if (username && username.trim() !== "") {
    return await getSmartbuildToken(username, password);
  }

  return await getAuthenticatedSmartbuild(locationId);
};
