export class AppError extends Error {
    constructor(message, statusCode, errorCode) {
      super(message);
      this.statusCode = statusCode;
      this.errorCode = errorCode;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export const ErrorCodes = {
    NOT_FOUND: 'NOT_FOUND',
    LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
    OPPORTUNITY_NOT_FOUND: 'OPPORTUNITY_NOT_FOUND',
    INVALID_TOKEN: 'INVALID_TOKEN',
    UNAUTHORIZED: 'UNAUTHORIZED',
    BAD_REQUEST: 'BAD_REQUEST',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  };
  
  // Helper functions to create specific errors
  export const createLocationNotFoundError = (locationId) => 
    new AppError(`Location ${locationId} not found`, 404, ErrorCodes.LOCATION_NOT_FOUND);
  
  export const createOpportunityNotFoundError = (opportunityId) => 
    new AppError(`Opportunity ${opportunityId} not found`, 404, ErrorCodes.OPPORTUNITY_NOT_FOUND);
  
  export const createUnauthorizedError = (message = 'Unauthorized access') => 
    new AppError(message, 401, ErrorCodes.UNAUTHORIZED);