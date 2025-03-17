const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const authRoute = require("./routes/auth"); // Import the auth routes

// Load environment variables from .env file
dotenv.config();
console.log()
// Debugging: Check if the Mongo URI is correctly loaded (remove this in production)
console.log("Mongo URI:", process.env.MONGO_URI);  // This will show the Mongo URI in the console

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Message Model (Schema)
const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// Socket.IO setup
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle incoming messages
  socket.on("send_message", (data) => {
    console.log("Message received:", data);
    socket.broadcast.emit("receive_message", data);  // Broadcast to other connected clients
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Routes
app.get("/", (req, res) => res.send("Chat App Backend Running"));

// POST route for sending messages
app.post("/api/messages", async (req, res) => {
  const { sender, receiver, text } = req.body;

  try {
    const newMessage = new Message({
      sender,
      receiver,
      text,
    });

    await newMessage.save();
    res.status(201).json(newMessage);  // Send the saved message as a response
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error });
  }
});

// GET route to fetch all messages
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find();  // Fetch all messages from the database
    res.status(200).json(messages);  // Send the messages as a response
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve messages", error });
  }
});

// Auth routes - Registration and Login
app.use("/api/auth", authRoute);  // Adding the auth route

// Set the port to use from environment variable or default to 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
app.use(express.static("public"));
