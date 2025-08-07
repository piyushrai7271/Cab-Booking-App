const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL)
    console.log("MongoDb DataBase Connected Successsfully");
  } catch (error) {
    console.log("MongoDb DataBase Connection Failed", error);
    process.exit(1);
  }
};

module.exports = connectDB;
