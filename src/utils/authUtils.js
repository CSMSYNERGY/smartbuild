export const hasRequiredScopes = (userScopeString) => {
  if (!userScopeString) return false;

  // Convert the user's scope string into an array
  const userScopes = new Set(userScopeString.split(" "));

  // Retrieve required scopes from the environment variable
  const requiredScopes = process.env.GHL_SCOPES?.split(" ") || [];

  // Check if all required scopes exist in the user's scopes
  return requiredScopes.every((scope) => userScopes.has(scope));
};

export const getAccountType = (tokenResponse) => {
  if (!tokenResponse || typeof tokenResponse !== "object") {
    throw new Error("Invalid token response");
  }

  // If `locationId` exists, user belongs to a sub-account
  return tokenResponse.locationId ? "sub-account" : "agency";
};

export const isTokenExpired = (createdAt, expiresIn) => {
  if (!createdAt || !expiresIn) {
    throw new Error("Invalid token data: Missing createdAt or expiresIn");
  }

  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  const expirationTime = createdAt + expiresIn; // When the token expires

  return currentTime >= expirationTime; // Returns true if expired, false if still valid
};
