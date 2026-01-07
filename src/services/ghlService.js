import axios from "axios";
import { AppError, ErrorCodes } from "../models/errors.js";

export const updateOpportunity = async (accessToken, opportunityId, body) => {
  const url = `${process.env.GHL_BASE_URL}/opportunities/${opportunityId}`;

  try {
    const putResponse = await axios.put(url, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Version: process.env.GHL_DEFAULT_API_VERSION,
      },
    });

    return putResponse.data;
  } catch (error) {
    // If the error comes from axios, it will have a response object
    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 404:
          throw new AppError(
            `Opportunity not found: ${error.message}`,
            404,
            ErrorCodes.OPPORTUNITY_NOT_FOUND
          );
        case 401:
          throw new AppError(
            `Authentication failed: ${error.message}`,
            401,
            ErrorCodes.UNAUTHORIZED
          );
        case 403:
          throw new AppError(
            `Permission denied: ${error.message}`,
            403,
            ErrorCodes.FORBIDDEN
          );
        case 400:
          throw new AppError(
            `Invalid request: ${error.message}`,
            400,
            ErrorCodes.BAD_REQUEST
          );
        default:
          throw new AppError(
            `Update opportunity failed: ${error.message}`,
            500,
            ErrorCodes.INTERNAL_SERVER_ERROR
          );
      }
    }

    // If there's no response object, it's likely a network error
    throw new AppError(
      `Update opportunity failed: ${error.message}`,
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};

export const getOpportunity = async (accessToken, opportunityId) => {
  const url = `${process.env.GHL_BASE_URL}/opportunities/${opportunityId}`;

  try {
    const getResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Version: process.env.GHL_DEFAULT_API_VERSION,
      },
    });

    return getResponse.data;
  } catch (error) {
    throw new AppError(
      `Get opportunity failed: ${error.message}`,
      404,
      ErrorCodes.OPPORTUNITY_NOT_FOUND
    );
  }
};

export const getOpportunityForMapping = async (accessToken, opportunityId) => {
  const url = `${process.env.GHL_BASE_URL}/opportunities/${opportunityId}`;

  try {
    const getResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Version: process.env.GHL_DEFAULT_API_VERSION,
      },
    });
    const opportunity = getResponse.data?.opportunity ?? null;
    if (opportunity == null) {
      return null;
    }
    return {
      id: opportunity.id,
      name: opportunity.name,
      status: opportunity.status,
      monetaryValue: opportunity.monetaryValue,
      source: opportunity.source,
      contactName: opportunity.contact?.name,
      contactEmail: opportunity.contact?.email,
      contactPhone: opportunity.contact?.phone,
    };
  } catch (error) {
    // If GHL returns 400 with message about opportunity not existing, return null
    if (
      error.response?.status === 400 &&
      error.response?.data?.message?.includes("doesn't exist or is deleted")
    ) {
      return null;
    }

    throw new AppError(
      `Get opportunity failed: ${error.message}`,
      404,
      ErrorCodes.OPPORTUNITY_NOT_FOUND
    );
  }
};

export const searchOpportunities = async (
  accessToken,
  locationId,
  query,
  page,
  limit
) => {
  const url = `${process.env.GHL_BASE_URL}/opportunities/search?location_id=${locationId}&q=${query}&page=${page}&limit=${limit}`;

  try {
    const getResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Version: process.env.GHL_DEFAULT_API_VERSION,
      },
    });

    if (
      getResponse?.data?.opportunities == null ||
      getResponse?.data?.meta == null
    ) {
      throw new AppError(
        `Get opportunity failed: Invalid response structure`,
        500,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }

    const opportunities =
      getResponse.data.opportunities.map((opportunity) => {
        const opportunityObj = {
          id: opportunity.id,
          name: opportunity.name,
          status: opportunity.status,
          monetaryValue: opportunity.monetaryValue,
          assignedTo: opportunity.assignedTo,
          pipeline: opportunity.pipeline,
        };
        opportunityObj.contact = opportunity.contact
          ? {
              id: opportunity.contact.id,
              name: opportunity.contact.name,
              email: opportunity.contact.email,
              phone: opportunity.contact.phone,
            }
          : null;
        return opportunityObj;
      }) || [];

    const meta = {
      totalCount: getResponse.data.meta.total,
      currentPage: getResponse.data.meta.currentPage,
      totalPages: Math.ceil(getResponse.data.meta.total / limit),
      previousPage:
        getResponse.data.meta.prevPage &&
        getResponse.data.meta.prevPage.length > 0
          ? getResponse.data.meta.prevPage
          : null,
      nextPage:
        getResponse.data.meta.nextPage &&
        getResponse.data.meta.nextPage.length > 0
          ? getResponse.data.meta.nextPage
          : null,
    };
    return {
      opportunities,
      meta,
    };
  } catch (error) {
    throw new AppError(
      `Get opportunity failed: ${error.message}`,
      404,
      ErrorCodes.OPPORTUNITY_NOT_FOUND
    );
  }
};

export const getPipelines = async (accessToken, locationId) => {
  const url = `${process.env.GHL_BASE_URL}/opportunities/pipelines?locationId=${locationId}`;

  try {
    const getResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Version: process.env.GHL_DEFAULT_API_VERSION,
      },
    });

    return getResponse.data?.pipelines || [];
  } catch (error) {
    throw new AppError(
      `Get opportunity failed: ${error.message}`,
      404,
      ErrorCodes.NOT_FOUND
    );
  }
};

export const getUsers = async (accessToken, locationId) => {
  const url = `${process.env.GHL_BASE_URL}/users/?locationId=${locationId}`;

  try {
    const getResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Version: process.env.GHL_DEFAULT_API_VERSION,
      },
    });

    return getResponse.data?.users || [];
  } catch (error) {
    throw new AppError(
      `Get users failed: ${error.message}`,
      404,
      ErrorCodes.NOT_FOUND
    );
  }
};

export const retrieveOpportunityCustomFields = async (
  accessToken,
  locationId
) => {
  const url = `${process.env.GHL_BASE_URL}/locations/${locationId}/customFields?model=opportunity`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Version: process.env.GHL_DEFAULT_API_VERSION,
      },
    });

    // Map the response data to the required format
    const mappedFields = response.data.customFields.reduce((acc, field) => {
      const mappedField = {
        field: field.id,
        title: field.name,
        required: false,
      };

      // Map the dataType to fieldType
      switch (field.dataType) {
        case "TEXTAREA":
        case "DATE":
        case "TEXT":
          mappedField.fieldType = "string";
          acc.push(mappedField);
          break;
        case "NUMERICAL":
        case "MONETORY":
          mappedField.fieldType = "numeric";
          acc.push(mappedField);
          break;
        case "RADIO":
          mappedField.fieldType = "radio";
          if (field.picklistOptions) {
            mappedField.options = field.picklistOptions.map((option) => ({
              label: option,
              value: option.toLowerCase(),
            }));
          }
          acc.push(mappedField);
          break;
        case "MULTI_SELECT":
          mappedField.fieldType = "multiselect";
          if (field.picklistOptions) {
            mappedField.options = field.picklistOptions.map((option) => ({
              label: option,
              value: option.toLowerCase(),
            }));
          }
          acc.push(mappedField);
          break;
        case "SELECT":
          mappedField.fieldType = "select";
          if (field.picklistOptions) {
            mappedField.options = field.picklistOptions.map((option) => ({
              label: option,
              value: option.toLowerCase(),
            }));
          }
          acc.push(mappedField);
          break;
        case "TOGGLE":
          mappedField.fieldType = "toggle";
          acc.push(mappedField);
          break;
        case "CHECKBOX":
          mappedField.fieldType = "checkbox";
          acc.push(mappedField);
          break;
        // No default case - fields with unknown types will be skipped
      }

      return acc;
    }, []);

    return mappedFields;
  } catch (error) {
    throw new AppError(
      `Get opportunity custom fields failed: ${error.message}`,
      error.response?.status || 500,
      ErrorCodes.INTERNAL_SERVER_ERROR
    );
  }
};
