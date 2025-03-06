import { AppError, ErrorCodes } from "../models/errors.js";

export const retrieveOpportunityData = (requestBody) => {
  

  const { opportunityID, ...opportunityFields } = requestBody;

  if (!opportunityID) {
    throw new AppError("Opportunity ID is required", 400, ErrorCodes.BAD_REQUEST);
  }

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
    opportunityID,
    opportunityData,
  };
};
