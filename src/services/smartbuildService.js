import axios from "axios";
import logger from "../config/logger.js";
import {
  parseRevision,
  parsePayments,
  parseMeasurement,
  parsePrice,
} from "../utils/smartbuildUtils.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import { Timestamp } from "@google-cloud/firestore";
import { isTokenExpired } from "../utils/authUtils.js";
import {
  getSmartbuildAuthData,
  saveSmartbuildAuthData,
} from "./firestoreService.js";
export const getSmartbuildToken = async (username, password) => {
  try {
    const response = await axios.post(
      `${process.env.SMARTBUILD_BASE_URL}/token`,
      new URLSearchParams({
        grant_type: "password",
        username: username,
        password: password,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(
        `Get authorization failed with status ${response.status}`
      );
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expires: Timestamp.fromDate(new Date(response.data[".expires"])),
    };
  } catch (error) {
    throw new AppError(
      `Error getting access token from smartbuild: ${error.message}`,
      401,
      ErrorCodes.UNAUTHORIZED
    );
  }
};

export const getSmartbuildTokenFromRefreshToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      `${process.env.SMARTBUILD_BASE_URL}/token`,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(
        `Get authorization failed with status ${response.status}`
      );
    }

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expires: Timestamp.fromDate(new Date(response.data[".expires"])),
    };
  } catch (error) {
    throw new AppError(
      `Error getting refresh token from smartbuild: ${error.message}`,
      401,
      ErrorCodes.UNAUTHORIZED
    );
  }
};

export const createOrEditJob = async (accessToken, jobId, modelID, body) => {
  var model =
    jobId === "0"
      ? await getStartingModel(accessToken, modelID)
      : await getExistingModel(accessToken, jobId);
  var modelAnswers = setInputAnswers(model, body);
  var jobRequest = await createOrEditJobRequest(
    accessToken,
    jobId,
    modelAnswers
  );
  return jobRequest;
};

const getStartingModel = async (accessToken, modelID) => {
  const url = `${process.env.SMARTBUILD_BASE_URL}/api/V2/GetStartingModel?startingModelId=${modelID}`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status !== 200) {
      throw new Error(
        `Get model request failed for url ${url} with status ${response.status}`
      );
    }

    return response.data;
  } catch (error) {
    throw new AppError(
      `Error fetching starting model: ${error.message}`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
};

const getExistingModel = async (accessToken, jobId) => {
  const url = `${process.env.SMARTBUILD_BASE_URL}/api/V2/GetJobDataModel?jobId=${jobId}`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.status !== 200) {
      throw new Error(
        `Get existing model request failed for url ${url} with status ${response.status}`
      );
    }

    return response.data;
  } catch (error) {
    throw new AppError(
      `Error fetching existing model: ${error.message}`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
};

function setInputAnswers(modelAnswers, inputAnswers) {
  if (!modelAnswers || !Array.isArray(modelAnswers.Answers)) {
    throw new AppError(
      "Model answers are not properly initialized.",
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  const answerMap = new Map(
    modelAnswers.Answers.map((answer) => [answer.id, answer])
  );

  for (const [id, value] of Object.entries(inputAnswers)) {
    if (answerMap.has(id)) {
      answerMap.get(id).value = value;
    } else {
      modelAnswers.Answers.push({ id: id, value: value }); //pushing non existing answers
    }
  }

  return modelAnswers;
}

async function createOrEditJobRequest(accessToken, jobId, modelAnswers) {
  const url = `${process.env.SMARTBUILD_BASE_URL}/api/V2/SetJobDataModel?jobId=${jobId}`;

  try {
    const postResponse = await axios.post(url, modelAnswers, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (postResponse.status !== 200) {
      throw new Error(
        `Create or edit job request failed for url ${url} with status ${postResponse.status}`
      );
    }

    return String(postResponse.data);
  } catch (error) {
    throw new AppError(
      `Create or edit job failed: ${error.message}`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
}

export const getJobData = async (
  accessToken,
  jobId,
  jobInfoIds,
  jobTokenValues
) => {
  const jobData = await getExistingJobData(
    accessToken,
    jobId,
    jobInfoIds,
    jobTokenValues
  );
  const [projectNameWithoutRev, revCount] = parseRevision(
    jobData.AnswerResult["ProjectName"]
  );

  let result = {
    NewOpportunityName: `${projectNameWithoutRev} ${jobData.TokenResult["MainBuildingWidth"]}x${jobData.TokenResult["MainBuildingLength"]}x${jobData.TokenResult["MainBuildingCeilingHeight"]}`,
    TotalPrice: jobData.TokenResult["TotalPrice"],
    Rev: revCount,
    ...jobData.AnswerResult,
  };

  const payments = parsePayments(jobData.AnswerResult["PaymentSchedule"]);
  if (Object.keys(payments).length > 0) {
    Object.keys(payments).forEach((val) => {
      payments[val] = Number(
        ((payments[val] * jobData.TokenResult["TotalPrice"]) / 100).toFixed(2)
      );
    });

    result = { ...result, ...payments };
  }

  return result;
};

const getExistingJobData = async (token, jobId, jobInfoIds, jobTokenValues) => {
  const url = `${process.env.SMARTBUILD_BASE_URL}/api/V2/GetJobData?jobId=${jobId}`;
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await axios.get(url, { headers });
    if (response.status != 200) {
      throw new Error(
        `Get existing job data request failed for url ${url} with status ${response.status}`
      );
    }

    const tokenValues = response.data.TokenValues;

    const tokenValueMap = tokenValues.reduce((acc, item) => {
      acc[item.token] = item.value || ""; // Default value is an empty string if empty
      return acc;
    }, {});

    const tokenResult = jobTokenValues.reduce((acc, key) => {
      acc[key] = tokenValueMap[key] || ""; // Assign an empty string if the key is not present
      return acc;
    }, {});

    tokenResult["MainBuildingWidth"] = parseMeasurement(
      tokenResult["MainBuildingWidth"]
    );
    tokenResult["MainBuildingLength"] = parseMeasurement(
      tokenResult["MainBuildingLength"]
    );
    tokenResult["MainBuildingCeilingHeight"] = parseMeasurement(
      tokenResult["MainBuildingCeilingHeight"]
    );

    tokenResult["TotalPrice"] = parsePrice(tokenResult["TotalPrice"]);

    const answerValues = response.data.Answers;
    const answerValueMap = answerValues.reduce((acc, item) => {
      acc[item.Id] = item.Value || "";
      return acc;
    }, {});

    const answerResult = jobInfoIds.reduce((acc, key) => {
      acc[key] = answerValueMap[key] || ""; // Assign an empty string if the key is not present
      return acc;
    }, {});

    return { TokenResult: tokenResult, AnswerResult: answerResult };
  } catch (error) {
    throw new AppError(
      `Error fetching job data: ${error.message}`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
};

export const retrieveSmartbuildCustomFields = async (accessToken) => {
  const url = `${process.env.SMARTBUILD_BASE_URL}/api/V2/GetQuestions`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const response = await axios.get(url, { headers });
    const validTypes = ["string", "string2", "date"];

    const transformedData = response.data.Questions.filter(
      (question) =>
        validTypes.includes(question.Type) && Number(question.Index) < 2
    ).map((question) => ({
      field: question.Id,
      title: question.Prompt,
      fieldType: "string",
      required: false,
    }));

    return transformedData;
  } catch (error) {
    throw new AppError(
      `Error fetching smartbuild custom fields: ${error.message}`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
};

export const retrieveSmartbuildCustomFieldsForRetrieval = async (
  accessToken
) => {
  const url = `${process.env.SMARTBUILD_BASE_URL}/api/V2/GetQuestions`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const response = await axios.get(url, { headers });
    const validTypes = ["string", "string2", "date"];

    const transformedData = response.data.Questions.filter((question) =>
      validTypes.includes(question.Type)
    ).map((question) => ({
      value: question.Id,
      label: question.Prompt,
    }));

    return transformedData;
  } catch (error) {
    throw new AppError(
      `Error fetching smartbuild custom fields: ${error.message}`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }
};

export const getCreateOrEditJobMetaData = (body) => {
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

export const getRetrieveSmartbuildJobMetaData = (body) => {
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

export const removeProcessedKeys = (data) => {
  const updatedData = { ...data };

  delete updatedData.jobID;
  delete updatedData.modelID;
  delete updatedData.username;
  delete updatedData.password;
  return updatedData;
};

export const authenticateSmartbuild = async (
  locationId,
  smartbuildUserId,
  smartbuildUserPassword
) => {
  try {
    const smartbuildAuthData = await getSmartbuildToken(
      smartbuildUserId,
      smartbuildUserPassword
    );
    await saveSmartbuildAuthData(locationId, {
      ...smartbuildAuthData,
      smartbuildUserId: smartbuildUserId,
    });
  } catch (error) {
    throw error instanceof AppError
      ? error
      : new AppError(
          `Error getting authenticating smartbuild for location: ${error.message}`,
          500,
          ErrorCodes.INTERNAL_SERVER_ERROR
        );
  }
};

export const getAuthenticatedSmartbuild = async (locationId) => {
  try {
    const smartbuildAuthData = await getSmartbuildAuthData(locationId);
    if (!smartbuildAuthData) {
      throw new AppError(
        `Smartbuild auth data not found for location ${locationId}`,
        404,
        ErrorCodes.SMARTBUILD_AUTH_DATA_NOT_FOUND
      );
    }
    if (isTokenExpired(smartbuildAuthData.expires)) {
      logger.info(
        `Smartbuild token expired for location ${locationId}. Refreshing...`
      );
      const newSmartbuildAuthData = await getSmartbuildTokenFromRefreshToken(
        smartbuildAuthData.refreshToken
      );
      await saveSmartbuildAuthData(locationId, newSmartbuildAuthData);
      return newSmartbuildAuthData;
    }
    return smartbuildAuthData;
  } catch (error) {
    throw error instanceof AppError
      ? error
      : new AppError(
          `Error getting authenticated smartbuild for location: ${error.message}`,
          500,
          ErrorCodes.INTERNAL_SERVER_ERROR
        );
  }
};

export const getSmartbuildAuthentication = async (locationId) => {
  return await getAuthenticatedSmartbuild(locationId);
};

const isValidValue = (value) => {
  if (value === null || value === undefined) return false;

  if (typeof value === "object") return true; // keep nested objects/arrays

  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    return trimmed !== "" && trimmed !== "nan";
  }

  return true; // optionally allow numbers, booleans, etc.
};

export const sanitizeInput = (obj) => {
  const cleaned = {};
  for (const key in obj) {
    const value = obj[key];
    if (isValidValue(value)) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};
