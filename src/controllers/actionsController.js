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
import {
  getMapperForLocation,
  getMappersForLocation,
  getMapperTypes,
  getMapperValueForLocation,
  updateMapperForLocation,
} from "../services/mappersService.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import logger from "../config/logger.js";

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

export const getUpdateMapperDynamicFields = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);
  const data = sanitizeInput(req.body?.data || req.body);
  const { mapper_id, operation_type } = data;
  if (!mapper_id || !operation_type) {
    throw new AppError(
      "Missing required fields: mapper_id, operation_type",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
  if (operation_type !== "update" && operation_type !== "delete") {
    throw new AppError(
      "Invalid operation type: " + operation_type,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
  const mapper = await getMapperForLocation(locationId, mapper_id);
  const mapperTypes = await getMapperTypes();
  const mapperType = mapperTypes[mapper.type];
  const mapperKeyInput = {
    field: "mapping_key",
    title: `Mapping Key (${mapperType.name} ${
      mapperType.object?.key?.toUpperCase() || ""
    })`,
    fieldType: "string",
    required: true,
  };
  const inputs = [mapperKeyInput];
  if (operation_type === "update") {
    const objectConfiguration = mapper.objectConfiguration;
    Object.keys(objectConfiguration)
      .sort((a, b) =>
        objectConfiguration[a].localeCompare(objectConfiguration[b])
      )
      .forEach((key) => {
        const mapperValueInput = {
          field: key,
          title: `${key} (${objectConfiguration[key]})`,
          fieldType: "string",
          required: false,
          description: "test",
        };
        inputs.push(mapperValueInput);
      });
  }
  return res.status(200).json({
    inputs: [{ section: "Mapping information", fields: inputs }],
  });
};

export const getGetMappingValueDynamicFields = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);
  const data = sanitizeInput(req.body?.data || req.body);
  const { mapper_id } = data;
  if (!mapper_id) {
    throw new AppError(
      "Missing required fields: mapper_id",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  const mapper = await getMapperForLocation(locationId, mapper_id);
  const mapperTypes = await getMapperTypes();
  const mapperType = mapperTypes[mapper.type];
  let description = "";
  Object.keys(mapper.objectConfiguration).forEach((key) => {
    description += `${key} (${mapper.objectConfiguration[key]})`;
  });
  const mapperKeyInput = {
    field: "mapping_key",
    title: `Mapping Key (${mapperType.name} ${
      mapperType.object?.key?.toUpperCase() || ""
    })`,
    fieldType: "string",
    description,
    required: true,
  };
  const inputs = [mapperKeyInput];

  return res.status(200).json({
    inputs: [{ section: "Mapping information", fields: inputs }],
  });
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

  const smartbuildAuthentication = await getAuthenticatedSmartbuild(locationId);
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
  const smartbuildAuthentication = await getAuthenticatedSmartbuild(locationId);

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

export const getMapperValue = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);
  const data = sanitizeInput(req.body?.data || req.body);
  const { mapper_id, mapping_key } = data;
  if (!mapper_id || !mapping_key) {
    throw new AppError(
      "Missing required fields: mapper_id, mapping_key",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
  const value = await getMapperValueForLocation(
    locationId,
    data.mapper_id,
    data.mapping_key
  );
  return res.status(200).json({ ...value });
};

export const updateMapper = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);
  const data = sanitizeInput(req.body?.data || req.body);
  const { mapper_id, operation_type, mapping_key, ...inner_value_map } = data;

  if (!mapper_id || !operation_type || !mapping_key) {
    throw new AppError(
      "Missing required fields: mapper_id, operation_type, mapping_key",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  const mapper = await getMapperForLocation(locationId, mapper_id);
  const configKeys = Object.keys(mapper.objectConfiguration);
  let message = "";
  if (operation_type === "update") {
    const valueObj = mapper.map[mapping_key] || {};
    const validKeys = Object.keys(inner_value_map).filter((innerKey) =>
      configKeys.includes(innerKey)
    );
    validKeys.forEach((innerKey) => {
      const value = inner_value_map[innerKey];
      if (
        value != null &&
        typeof value === "string" &&
        value.trim().length > 0
      ) {
        valueObj[innerKey] = value;
      }
    });
    mapper.map[mapping_key] = valueObj;
    message = `Mapping key ${mapping_key} updated successfully to ${valueObj}`;
  } else if (operation_type === "delete") {
    delete mapper.map[mapping_key];
    message = `Mapping key ${mapping_key} deleted successfully`;
  }
  logger.info("Mapping updated: ", {
    locationId,
    mapper_id,
    operation_type,
    mapping_key,
    message,
  });
  await updateMapperForLocation(locationId, mapper_id, mapper);
  return res.status(200).json({ message });
};

export const getMappers = async (req, res) => {
  const locationId = getLocationIdFromRequest(req);
  const mappers = await getMappersForLocation(locationId);
  return res.status(200).json({
    options: mappers.map((mapper) => ({
      value: mapper.id,
      label: mapper.name,
    })),
  });
};
