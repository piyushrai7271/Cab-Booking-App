const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
const Driver = require("../models/AdminModels/driver.model");

// ✅ Get Distance and Duration between two locations using Go Maps API
const getDistanceTime = async (origin, destination) => {
  if (!origin || !destination) {
    throw new Error("Both origin and destination are required");
  }

  const apiKey = process.env.GOMAPS_PRO_API_KEY;

  const url = `https://maps.gomaps.pro/maps/api/distancematrix/json?origins=${encodeURIComponent(
    origin
  )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);

    if (response.data.status === "OK") {
      if (response.data.rows[0].elements[0].status === "ZERO_RESULTS") {
        throw new Error("No routes found");
      }

      return response.data.rows[0].elements[0];
    } else {
      console.error("API Error:", response.data);
      throw new Error(
        `Unable to fetch distance and time: ${response.data.status}`
      );
    }
  } catch (error) {
    console.error(
      "Error fetching distance and time:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

//✅ Get Fare
const getFare = (distanceMeters, durationSeconds, cab) => {
  const distanceInKm = distanceMeters / 1000;

  if (cab.priceOptions.rateType === "Per KM") {
    return Math.round(cab.priceOptions.price * distanceInKm);
  } else if (cab.priceOptions.rateType === "Per Hour") {
    const durationInHours = durationSeconds / 3600;
    return Math.round(cab.priceOptions.price * durationInHours);
  } else {
    throw new Error(`Unsupported rateType: ${cab.rateType}`);
  }
};

// ✅ Get Address Coordinates
const getAddressCoordinate = async (address) => {
  try {
    const apiKey = process.env.GOMAPS_PRO_API_KEY;
    const response = await axios.get(
      `https://maps.gomaps.pro/maps/api/geocode/json`,
      {
        params: {
          address: address,
          key: apiKey,
        },
      }
    );
    console.log("Response Status:", response.status);
    // console.log('Response Data:', JSON.stringify(response.data, null, 2));
    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        ltd: location.lat,
        lng: location.lng,
      };
    } else {
      throw new Error("No coordinates found for the given address");
    }
  } catch (error) {
    // console.error('Error fetching coordinates:', error);
    throw error;
  }
};

//✅ Get AutoComplete Suggestions
const getAutoCompleteSuggestions = async (input) => {
  if (!input) {
    throw new Error("query is required");
  }

  const apiKey = process.env.GOMAPS_PRO_API_KEY;
  const url = `https://maps.gomaps.pro/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    // console.log(response.data);
    if (response.data.status === "OK") {
      return response.data.predictions.map(
        (prediction) => prediction.description
      );
    } else {
      throw new Error("Unable to fetch suggestions");
    }
  } catch (err) {
    // console.error(err);
    throw err;
  }
};

// ✅ Get Driver's in the Radius
const getDriversInTheRadius = async (ltd, lng, radius) => {
  const driver = await Driver.find({
    location: {
      $geoWithin: {
        $centerSphere: [[ltd, lng], radius / 6371],
      },
    },
  });

  return driver;
};

module.exports = {
  getDistanceTime,
  getFare,
  getAddressCoordinate,
  getAutoCompleteSuggestions,
  getDriversInTheRadius,
};
