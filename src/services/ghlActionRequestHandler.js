import { AppError, ErrorCodes } from "../models/errors.js";

export const retrieveOpportunityData = (requestBody) => {
  if (!requestBody?.data || !requestBody?.extras) {
    throw new AppError("Invalid request data structure", 400, ErrorCodes.BAD_REQUEST);
  }

  const { data, extras } = requestBody;
  const { opportunityID, ...opportunityFields } = data;
  const { locationId } = extras;

  // Validate required fields
  if (!opportunityID || !locationId) {
    throw new AppError("Missing required fields", 400, ErrorCodes.BAD_REQUEST);
  }

  // Remove opportunityID from data and get remaining fields

  const nonCustomFields = ['pipelineStageId', 'name', 'status', 'monetaryValue', 'assignedTo'];
  
  // Filter out empty/null/undefined values and structure the data
  const filteredEntries = Object.entries(opportunityFields).filter(([_, value]) => 
    value != null && 
    value !== '' &&
    !(typeof value === 'object' && Object.keys(value).length === 0)
  );

  // Separate custom and non-custom fields
  const customFields = [];
  const standardFields = {};

  filteredEntries.forEach(([key, value]) => {
    if (nonCustomFields.includes(key)) {
      standardFields[key] = value;
    } else {
      customFields.push({ id: key, field_value: value });
    }
  });

  // Combine fields into final structure
  const opportunityData = {
    ...standardFields,
    ...(customFields.length > 0 && { customFields })
  };

  return {
    locationId,
    opportunityID,
    opportunityData,
  };
};
