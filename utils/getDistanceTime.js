const axios = require('axios')
const dotenv = require('dotenv')
dotenv.config()

 const getDistance = async (origin, destination) => {
    const apiKey = process.env.GOMAPS_PRO_API_KEY;
    const url = `https://maps.gomaps.pro/maps/api/distancematrix/json?origins=${encodeURIComponent(
      origin
    )}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;
   
    const response = await axios.get(url);
    // console.log(response.data)
    const data = response.data;
   
    if (
      data.status === "OK" &&
      data.rows[0]?.elements[0]?.status === "OK"
    )  return {
        distance: data.rows[0].elements[0].distance, // object: { text: '171 km', value: 171000 }
        duration: data.rows[0].elements[0].duration, // object: { text: '3 hours', value: 10800 }
      };
    else {
      throw new Error("Go Maps API failed to return distance");
    }
  };

  module.exports = getDistance;