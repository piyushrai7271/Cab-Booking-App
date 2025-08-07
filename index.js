
const dotenv = require("dotenv");
const http = require("http");
const connectDB = require("./config/db");
const { initializeSocket } = require("./utils/socket.io");

// Load env variables
dotenv.config();

// Initialize Express app
const app = require("./app");

// Connect MongoDB
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize socket.io
initializeSocket(server);

// Start listening
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
