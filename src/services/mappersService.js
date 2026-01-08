import { getAuthenticatedLocation } from "./authService.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import {
  getOpportunityForMapping,
  getPipelines,
  getUsers,
  searchOpportunities,
} from "./ghlService.js";
import {
  createMapperItem,
  deleteMapperItem,
  getMapperItem,
  getMapperItems,
  saveMapperItem,
} from "./firestoreService.js";
import { validateObjectProperties } from "../utils/globalUtils.js";

export const mapperTypes = {
  custom: {
    name: "Custom",
    description: "Custom type key",
    dynamic: false,
  },
  pipeline: {
    name: "Pipeline",
    description: "Pipeline type key",
    dynamic: false,
    object: {
      key: "id",
      availableFields: ["id", "name"],
    },
  },
  user: {
    name: "User",
    description: "User type key",
    dynamic: false,
    object: {
      key: "id",
      availableFields: ["id", "name", "email"],
    },
  },
  oppurtunity: {
    name: "Oppurtunity",
    description: "Oppurtunity type key",
    dynamic: true,
    object: {
      key: "id",
      availableFields: [
        "id",
        "name",
        "monetaryValue",
        "source",
        "status",
        "contactName",
        "contactEmail",
        "contactPhone",
      ],
    },
  },
};

export const getMapperProperty = (index) => {
  return `Value ${index + 1}`;
};

export const mapperObjects = {
  pipeline: async (accessToken, locationId) => {
    const pipelines = await getPipelines(accessToken, locationId);
    const result = {};
    pipelines.forEach((pipeline) => {
      const pipelineObj = {
        id: pipeline.id,
        name: pipeline.name,
      };
      result[pipeline.id] = pipelineObj;
    });
    return result;
  },
  user: async (accessToken, locationId) => {
    const result = {};
    const users = await getUsers(accessToken, locationId);
    users.forEach((user) => {
      const userObj = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
      result[user.id] = userObj;
    });
    return result;
  },
};

export const mapperObjectsDynamic = {
  oppurtunity: {
    get: async (accessToken, locationId, mapperKey) => {
      const opportunity = await getOpportunityForMapping(
        accessToken,
        mapperKey
      );
      return opportunity;
    },
    search: async (accessToken, locationId, query, page, limit) => {
      const oppurtunities = await searchOpportunities(
        accessToken,
        locationId,
        query,
        page,
        limit
      );
      return oppurtunities;
    },
  },
};

export const getMappersForLocation = async (locationId) => {
  const items = await getMapperItems(locationId);
  return items;
};

export const getMapperForLocation = async (locationId, mapperId) => {
  const item = await getMapperItem(locationId, mapperId);
  if (!item) {
    throw new AppError(
      `Mapper ${mapperId} not found`,
      404,
      ErrorCodes.NOT_FOUND
    );
  }

  const typeKey = item.type;
  item.dynamic = mapperTypes[typeKey].dynamic;

  if (typeKey in mapperObjects) {
    const locationData = await getAuthenticatedLocation(locationId);
    item.options = await mapperObjects[typeKey](
      locationData.accessToken,
      locationId
    );
  }

  return item;
};

export const createMapperForLocation = async (
  locationId,
  name,
  type,
  objectProperties
) => {
  if (!(type in mapperTypes)) {
    throw new AppError(
      `Invalid mapper type: ${type}`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  // Validate and get cleaned properties
  const validatedProperties = validateObjectProperties(objectProperties);

  // Build object configuration from validated properties
  const objectConfiguration = {};
  validatedProperties.forEach((property, index) => {
    objectConfiguration[property] = getMapperProperty(index);
  });

  const item = await createMapperItem(locationId, {
    name,
    type,
    map: {},
    objectConfiguration,
  });
  return item.id;
};

export const updateMapperForLocation = async (locationId, mapperId, mapper) => {
  // Only save allowed fields - options and dynamic are computed on-the-fly
  const sanitizedMapper = {
    name: mapper.name,
    map: mapper.map || {},
  };
  await saveMapperItem(locationId, mapperId, sanitizedMapper, false);
};

export const deleteMapperForLocation = async (locationId, mapperId) => {
  await deleteMapperItem(locationId, mapperId);
};

export const getMapperValueForLocation = async (locationId, mapperId, key) => {
  const mapper = await getMapperForLocation(locationId, mapperId);
  if (mapper == null) {
    throw new AppError(
      `Mapper ${mapperId} not found. Try creating the mapper first.`,
      404,
      ErrorCodes.NOT_FOUND
    );
  }

  if (!(key in mapper.map)) {
    throw new AppError(
      `Key mapping for ${key} in mapper ${mapperId} not found. Try adding the key to the mapper first.`,
      404,
      ErrorCodes.NOT_FOUND
    );
  }

  const objectConfiguration = mapper.objectConfiguration;
  const valueObject = mapper.map[key];
  let result = {};
  Object.keys(valueObject).forEach((innerKey) => {
    result[objectConfiguration[innerKey]] = valueObject[innerKey];
  });

  return result;
};

export const getMapperTypes = async () => {
  return mapperTypes;
};

//search dynamic mapper objects
export const searchMapperObjectsDynamic = async (
  locationId,
  mapperId,
  query,
  page,
  limit
) => {
  const mapper = await getMapperForLocation(locationId, mapperId);
  if (!mapper || !mapperTypes[mapper.type].dynamic) {
    throw new AppError(
      `Mapper ${mapperId} not found or is not dynamic.`,
      404,
      ErrorCodes.NOT_FOUND
    );
  }
  const typeKey = mapper.type;
  const locationData = await getAuthenticatedLocation(locationId);
  const result = await mapperObjectsDynamic[typeKey].search(
    locationData.accessToken,
    locationId,
    query,
    page,
    limit
  );
  return result;
};

//get a specific object
export const getMapperObjectDynamic = async (
  locationId,
  mapperId,
  mapperKey
) => {
  const mapper = await getMapperForLocation(locationId, mapperId);
  if (!mapper || !mapperTypes[mapper.type].dynamic) {
    throw new AppError(
      `Mapper ${mapperId} not found or is not dynamic.`,
      404,
      ErrorCodes.NOT_FOUND
    );
  }
  const typeKey = mapper.type;
  const locationData = await getAuthenticatedLocation(locationId);
  const result = await mapperObjectsDynamic[typeKey].get(
    locationData.accessToken,
    locationId,
    mapperKey
  );
  return result;
};
