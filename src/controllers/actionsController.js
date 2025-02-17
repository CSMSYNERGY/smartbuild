import { DEFAULT_JOB_INFO_IDS, DEFAULT_JOB_TOKEN_VALUES } from "../constants/smartbuildAttributeDefaults.js";
import { getJobData } from "../services/smartbuildService.js";

export const updateOpportunity = async (req, res) => {
  const { opportunityId } = req.query;
  if (!opportunityId)
    return res.status(400).json({ error: "No opportunity id provided" });

  try {
    //await authenticateAndSaveUser(code);
    return res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const retrieveSmartbuildJob = async (req, res) => {
  const { smartbuildJobId, smartbuildUserId, smartbuildUserPassword } = req.query;
  const jobInfoIds = req.query.jobInfoIds || DEFAULT_JOB_INFO_IDS;
  const jobTokenValues = req.query.jobTokenValues || DEFAULT_JOB_TOKEN_VALUES;

  if (!smartbuildJobId || !smartbuildUserId || !smartbuildUserPassword)
    return res
      .status(400)
      .json({ error: "No sb job id, sb user id, or sb user password provided" });

  try {
    const accessToken = await getAccessToken(smartbuildUserId, smartbuildUserPassword);
    const jobData = await getJobData(accessToken, smartbuildJobId, jobInfoIds, jobTokenValues);
    return res.status(200).json(jobData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createOrEditSmartbuildJob = async (req, res) => {
  const { smartbuildJobId, smartbuildUserId, smartbuildUserPassword } =
    req.query;
  if (!smartbuildJobId || !smartbuildUserId || !smartbuildUserPassword)
    return res
      .status(400)
      .json({ error: "No sb job id, sb user id, or sb user password provided" });

  try {
    //await authenticateAndSaveUser(code);
    return res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
