export const parseMeasurement = (input) => {
  const regex = /^(\d+['"])/; // Regex to match the first number with unit
  const match = input.match(regex);
  return match ? match[1] : "0";
};

export const parsePayments = (input) => {
  const regex = /([\w\s]+?)\s*\.*=\s*(\d+)/g;
  const result = {};
  try {
    let match;
    while ((match = regex.exec(input)) !== null) {
      let key = match[1].replace(/\s+|\./g, ""); // Remove spaces and dots
      let value = parseInt(match[2], 10); // Extract the numeric value
      result[key] = value;
    }
  } catch (error) {}

  return result;
};

export const parsePrice = (priceString) => {
  try {
    const cleanedString = priceString.replace(/[$,]/g, ""); // Remove '$' and ',' characters
    const parsedValue = parseFloat(cleanedString);
    return isNaN(parsedValue) ? 0 : parsedValue;
  } catch (error) {
    return 0; // Return 0 for any unexpected errors
  }
};

export const parseRevision = (inputString) => {
  // Regular expression to match "rev. X"
  const regex = /^(.*)\s+rev\.\s*(\d+)$/i;

  const match = inputString.match(regex);

  if (match) {
    return [match[1], parseInt(match[2], 10)];
  }

  return [inputString, 0];
};

// Function to convert GHL's YYYY-MM-DD format to SmartBuild's M/D/YYYY format
export const convertToSmartBuildDateFormat = (ghlDate) => {
  // Check if it's already in SmartBuild format (M/D/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ghlDate)) {
    return ghlDate; // Return as is if it's already in SmartBuild format
  }

  // Validate if it's in GHL format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(ghlDate)) {
    const [year, month, day] = ghlDate.split("-");
    return `${parseInt(month)}/${parseInt(day)}/${year}`;
  }

  return ghlDate; // Return as is if it doesn't match expected formats
};

// Function to convert SmartBuild's M/D/YYYY format to GHL's YYYY-MM-DD format
export const convertToGHLDateFormat = (smartBuildDate) => {
  // Check if it's already in GHL format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(smartBuildDate)) {
    return smartBuildDate; // Return as is if it's already in GHL format
  }

  // Validate if it's in SmartBuild format (M/D/YYYY)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(smartBuildDate)) {
    const [month, day, year] = smartBuildDate.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return smartBuildDate; // Return as is if it doesn't match expected formats
};

export const convertDatesToSmartBuildFormat = (data) => {
  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase().includes("date") && value) {
      data[key] = convertToSmartBuildDateFormat(value);
    }
  }
  return data;
};

export const convertDatesToGHLFormat = (data) => {
  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase().includes("date") && value) {
      data[key] = convertToGHLDateFormat(value);
    }
  }
  return data;
};