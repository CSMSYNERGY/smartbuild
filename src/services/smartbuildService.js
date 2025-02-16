import axios from "axios";
import logger from "../config/logger.js";
import { OPPORTUNITY_MODEL_MAPPING } from '../constants/startingModels.js';

export const getAccessToken = async (username, password) => {
  try {
    const response = await axios.post(
      process.env.SMARTBUILD_AUTH_URL,
      new URLSearchParams({
        grant_type: "password", 
        username: username,
        password: password
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`Get authorization failed with status ${response.status}`);
    }

    return response.data.access_token;

  } catch (error) {
    logger.error("Error getting access token:", error);
    throw error instanceof Error 
      ? error 
      : new Error("Error fetching job data: " + error);
  }
};

export async function getStartingModel(accessToken, opportunityType) {
  const model_id = OPPORTUNITY_MODEL_MAPPING[opportunityType];
  const url = `${process.env.SMARTBUILD_BASE_URL}/V2/GetStartingModel?startingModelId=${model_id}`;
  
  try {
    const response = await customRequest.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.status !== 200) {
      throw new Error(`Get model request failed for url ${url} with status ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error(error);
  }
}

export async function getExistingModel(accessToken, jobId) {
  const url = `${process.env.SMARTBUILD_BASE_URL}/V2/GetJobDataModel?jobId=${jobId}`;
  
  try {
    const response = await customRequest.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (response.status !== 200) {
      throw new Error(`Get existing model request failed for url ${url} with status ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Error fetching model: " + error);
  }
}

export function setInputAnswers(modelAnswers, inputAnswers) {
  if (!modelAnswers || !Array.isArray(modelAnswers.Answers)) {
    throw new Error("Model answers are not properly initialized.");
  }

  const answerMap = new Map(
    modelAnswers.Answers.map((answer) => [answer.id, answer])
  );

  const notFoundIds = [];
  for (const [id, value] of Object.entries(inputAnswers)) {
    if (answerMap.has(id)) {
      answerMap.get(id).value = value;
    } else {
      modelAnswers.Answers.push({ id, value });
      notFoundIds.push(id);
    }
  }
  
  if (notFoundIds.length > 0) {
    console.warn("Some input answers were not available in the job model and added manually:", notFoundIds);
  }
  
  return modelAnswers;
}

export async function createOrEditJob(accessToken, jobId, modelAnswers) {
  const url = `${process.env.SMARTBUILD_BASE_URL}/V2/SetJobDataModel?jobId=${jobId}`;
  
  try {
    const postResponse = await customRequest.post(url, {
      data: modelAnswers,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      }
    });

    if (postResponse.status !== 200) {
      throw new Error(`Create job request failed for url ${url} with status ${postResponse.status}`);
    }

    return String(postResponse.data);
  } catch (error) {
    throw error instanceof Error ? error : new Error("Create or edit job failed:" + error);
  }
}
