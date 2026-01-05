import { getAuthenticatedLocation } from "./authService.js";
import { AppError, ErrorCodes } from "../models/errors.js";
import { getPipelines, getUsers } from "./ghlService.js";
import {
  createMapperItem,
  deleteMapperItem,
  getMapperItem,
  getMapperItems,
  saveMapperItem,
} from "./firestoreService.js";

export const mapperTypes = {
  custom: {
    name: "Custom",
    description: "Custom type key",
  },
  pipeline: {
    name: "Pipeline",
    description: "Pipeline type key",
  },
  user: {
    name: "User",
    description: "User type key",
  },
};

export const mapperOptions = {
  pipeline: async (accessToken, locationId) => {
    const pipelines = await getPipelines(accessToken, locationId);
    return pipelines.map((pipeline) => ({
      id: pipeline.id,
      name: pipeline.name,
    }));
  },
  user: async (accessToken, locationId) => {
    const users = await getUsers(accessToken, locationId);
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }));
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
  if (typeKey in mapperOptions) {
    const locationData = await getAuthenticatedLocation(locationId);
    item.options = await mapperOptions[typeKey](
      locationData.accessToken,
      locationData.locationId
    );
  }

  return item;
};

export const createMapperForLocation = async (locationId, name, type) => {
  if (!(type in mapperTypes)) {
    throw new AppError(
      `Invalid mapper type: ${type}`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  const item = await createMapperItem(locationId, { name, type, map: {} });
  return item.id;
};

export const updateMapperForLocation = async (locationId, mapperId, mapper) => {
  await saveMapperItem(locationId, mapperId, mapper);
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
  return mapper.map[key];
};

//unused for now
const getMapperOptionsForType = async (locationId, typeKey) => {
  if (!(typeKey in mapperOptions)) {
    throw new AppError(
      `Invalid mapper type: ${typeKey}`,
      400,
      ErrorCodes.BAD_REQUEST
    );
  }

  const locationData = await getAuthenticatedLocation(locationId);
  const result = await mapperOptions[typeKey](
    locationData.accessToken,
    locationData.locationId
  );
  return result;
};
