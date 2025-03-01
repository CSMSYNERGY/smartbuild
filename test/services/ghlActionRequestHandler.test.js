import { retrieveOpportunityData } from "../../src/services/ghlActionRequestHandler.js";
import { AppError } from "../../src/models/errors.js";

describe("ghlActionRequestHandler", () => {
  describe("retrieveOpportunityData", () => {
    it("should successfully process valid request data", () => {
      const mockRequestBody = {
        opportunityID: "123",
        name: "Test Opportunity",
        status: "active",
        monetaryValue: 1000,
        assignedTo: "user1",
        customField1: "value1",
        customField2: "value2",
      };

      const result = retrieveOpportunityData(mockRequestBody);

      expect(result).toEqual({
        opportunityID: "123",
        opportunityData: {
          name: "Test Opportunity",
          status: "active",
          monetaryValue: 1000,
          assignedTo: "user1",
          customFields: [
            { id: "customField1", field_value: "value1" },
            { id: "customField2", field_value: "value2" },
          ],
        },
      });
    });

    it("should handle request with no custom fields", () => {
      const mockRequestBody = {
        opportunityID: "123",
        name: "Test Opportunity",
        status: "active",
      };

      const result = retrieveOpportunityData(mockRequestBody);

      expect(result).toEqual({
        opportunityID: "123",
        opportunityData: {
          name: "Test Opportunity",
          status: "active",
        },
      });
    });

    it("should throw AppError if request body is missing data or extras", () => {
      const invalidRequestBodies = [
        {},
        { data: {} },
        { extras: {} },
        null,
        undefined,
      ];

      invalidRequestBodies.forEach((body) => {
        expect(() => retrieveOpportunityData(body)).toThrow(
          new AppError("Invalid request data structure", 400)
        );
      });
    });

    it("should throw AppError if required fields are missing", () => {
      const mockRequestBody = {
        data: {
          name: "Test Opportunity",
        },
        extras: {},
      };

      expect(() => retrieveOpportunityData(mockRequestBody)).toThrow(
        new AppError("Missing required fields", 400)
      );
    });

    it("should filter out null, empty string, and empty object values", () => {
      const mockRequestBody = {
        opportunityID: "123",
        name: "",
        status: null,
        pipelineStageId: undefined,
        emptyObject: {},
        validCustomField: "valid",
      };

      const result = retrieveOpportunityData(mockRequestBody);

      expect(result.opportunityData).toEqual({
        customFields: [{ id: "validCustomField", field_value: "valid" }],
      });
    });

    it("should correctly separate standard and custom fields", () => {
      const mockRequestBody = {
        opportunityID: "123",
        name: "Test",
        pipelineStageId: "stage1",
        customField1: "custom1",
        customField2: "custom2",
      };

      const result = retrieveOpportunityData(mockRequestBody);

      expect(result.opportunityData).toEqual({
        name: "Test",
        pipelineStageId: "stage1",
        customFields: [
          { id: "customField1", field_value: "custom1" },
          { id: "customField2", field_value: "custom2" },
        ],
      });
    });
  });
});
