import axios from 'axios';

export const updateOpportunity = async (accessToken, opportunityId, body) => {
  const url = `${process.env.GHL_BASE_URL}/opportunities/${opportunityId}`;

  try {
    const putResponse = await axios.put(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return putResponse.data;
  } catch (error) {
    logger.error(`Update opportunity failed: ${error.message}`);
    throw error;
  }
};
