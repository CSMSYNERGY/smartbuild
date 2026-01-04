import {
  DEFAULT_JOB_INFO_IDS,
  DEFAULT_JOB_TOKEN_VALUES,
} from "../constants/smartbuildAttributeDefaults.js";
import {
  createOrEditJob,
  getJobData,
  retrieveSmartbuildCustomFields,
  getCreateOrEditJobMetaData,
  getRetrieveSmartbuildJobMetaData,
  removeProcessedKeys,
  getSmartbuildAuthentication,
  sanitizeInput,
  getAuthenticatedSmartbuild,
} from "../services/smartbuildService.js";
import {
  retrieveOpportunityCustomFields,
  updateOpportunity,
} from "../services/ghlService.js";
import { getAuthenticatedLocation } from "../services/authService.js";
import { retrieveOpportunityData } from "../services/ghlActionRequestHandler.js";
import {
  convertDatesToGHLFormat,
  convertDatesToSmartBuildFormat,
} from "../utils/smartbuildUtils.js";
import { getLocationIdFromRequest } from "../utils/authUtils.js";

export const updateOpportunityAction = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);
  const data = sanitizeInput(req.body?.data || req.body);
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

  const data = sanitizeInput(req.body?.data || req.body);

  await getAuthenticatedLocation(locationId); //To prevent unauthorized access

  const smartbuildAuthentication = await getSmartbuildAuthentication(
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
  const convertedJobData = convertDatesToGHLFormat(jobData);
  convertedJobData["CurrentDate"] = new Date().toISOString().split("T")[0];
  return res.status(200).json(convertedJobData);
};

export const createOrEditSmartbuildJob = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);

  const data = sanitizeInput(req.body?.data || req.body);

  await getAuthenticatedLocation(locationId); //To prevent unauthorized access

  const { isCreate, modelID, jobID } = getCreateOrEditJobMetaData(data);
  const smartbuildAuthentication = await getSmartbuildAuthentication(
    locationId
  );

  const cleanedBody = removeProcessedKeys(data);
  const convertedBody = convertDatesToSmartBuildFormat(cleanedBody);

  const updatedOrCreatedJobId = await createOrEditJob(
    smartbuildAuthentication.accessToken,
    isCreate ? "0" : jobID,
    modelID,
    convertedBody
  );
  return res.status(200).json({ id: updatedOrCreatedJobId, created: isCreate });
};
