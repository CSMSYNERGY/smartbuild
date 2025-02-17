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

export const parseDateToFormat = (dateString) => {
  // match "m/d/yyyy"
  const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

  const match = dateString.match(dateRegex);

  if (match) {
    const [, month, day, year] = match;
    // Format as "mm-dd-yyyy"
    return `${month.padStart(2, "0")}-${day.padStart(2, "0")}-${year}`;
  }

  // If the string doesn't match the pattern, return ""
  /*
    const currentDate = new Date();
    const formattedCurrentDate = `${String(currentDate.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(currentDate.getDate()).padStart(
      2,
      "0"
    )}-${currentDate.getFullYear()}`;
    */
  return "";
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
