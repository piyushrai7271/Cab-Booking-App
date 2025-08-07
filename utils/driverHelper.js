const DriverAuth = require("../models/DriverModels/driverAuth.model");
const Driver = require("../models/AdminModels/driver.model");
 
const getDriverModelType = async (driverId) => {
  try {
    const driverAuth = await DriverAuth.findById(driverId);
    if (driverAuth) return { model: "DriverAuth", doc: driverAuth };
 
    const driver = await Driver.findById(driverId);
    if (driver) return { model: "Driver", doc: driver };
 
    return null;
  } catch (error) {
    console.error("Error in getDriverModelType:", error);
    throw error;
  }
};
 
module.exports = {
  getDriverModelType
};
 
 
 
 
// utils/dateFormat.js
 
function formatDate(date) {
  const d = new Date(date);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const hours = d.getHours() % 12 || 12;
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = d.getHours() >= 12 ? "PM" : "AM";
 
  return `${day} ${month} .${hours}:${minutes}${ampm}`;
}
 
 
function datFormatFunc(date) {
  if (!date) return '';
  
  const options = { 
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  return new Date(date).toLocaleDateString('en-US', options)
    .replace(/(\d+), (\d+)/, '$1 $2') // Remove comma after day
    .replace(/\s([AP]M)$/, '$1'); // Remove space before AM/PM
}
 
 
module.exports = { formatDate,datFormatFunc }