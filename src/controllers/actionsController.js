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
  const data = req.body?.data || req.body;
  const { opportunityID, opportunityData } = retrieveOpportunityData(data);

  const authenticatedLocation = await getAuthenticatedLocation(locationId);
  await updateOpportunity(
    authenticatedLocation.accessToken,
    opportunityID,
    opportunityData
  );

  return res.status(200).send();
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

  await getAuthenticatedLocation(locationId); //To prevent unauthorized access

  const authenticatedSmartbuild = await getAuthenticatedSmartbuild(locationId);

  const customFields = await retrieveSmartbuildCustomFields(
    authenticatedSmartbuild.accessToken
  );

  return res
    .status(200)
    .json({ inputs: [{ section: "Custom Fields", fields: customFields }] });
};

export const retrieveSmartbuildJob = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);

  const data = req.body?.data || req.body;

  await getAuthenticatedLocation(locationId); //To prevent unauthorized access

  const smartbuildAuthentication = await getSmartbuildAuthentication(
    data,
    locationId
  );
  const { jobID, extraUserAnswers, extraTokenValues } =
    getRetrieveSmartbuildJobMetaData(data);
  const jobInfoIds = [
    ...new Set([...DEFAULT_JOB_INFO_IDS, ...extraUserAnswers]),
  ];
  const jobTokenValues = [
    ...new Set([...DEFAULT_JOB_TOKEN_VALUES, ...extraTokenValues]),
  ];

  const jobData = await getJobData(
    smartbuildAuthentication.accessToken,
    jobID,
    jobInfoIds,
    jobTokenValues
  );
  return res.status(200).json(jobData);
};

export const createOrEditSmartbuildJob = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);

  const data = req.body?.data || req.body;

  await getAuthenticatedLocation(locationId); //To prevent unauthorized access

  const { isCreate, modelID, jobID } = getCreateOrEditJobMetaData(data);
  const smartbuildAuthentication = await getSmartbuildAuthentication(
    data,
    locationId
  );
  
  const cleanedBody = removeProcessedKeys(data);

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

const getRetrieveSmartbuildJobMetaData = (body) => {
  if (!body.jobID || body.jobID === "0") {
    throw new AppError(
      "JobID is required for retrieving a job",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  let extraUserAnswers = [];
  if (body.extraUserAnswers && typeof body.extraUserAnswers === "string") {
    extraUserAnswers = body.extraUserAnswers
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  let extraTokenValues = [];
  if (body.extraTokenValues && typeof body.extraTokenValues === "string") {
    extraTokenValues = body.extraTokenValues
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return {
    jobID: body.jobID,
    extraUserAnswers,
    extraTokenValues,
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
