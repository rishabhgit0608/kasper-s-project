const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to parse JSON request bodies
app.use(express.json());

// Basic Authentication (Replace with a database in production)
const users = {
  therapist: "therapist_password",
  user1: "user1_password",
};

// Authentication route (handles login requests)
app.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  if (!(username in users) || users[username] !== password) {
    return res.status(401).send("Invalid credentials");
  }

  // Successful login - no need to send anything back, just a 200 OK
  res.sendStatus(200);
});

// Middleware for authentication (for chat.html)
function authenticate(req, res, next) {
  // In a real application, you would typically use sessions or JWTs
  // to manage authentication after the initial login.
  // Here, we're simply relying on the username and role sent in the URL.

  const role = req.query.role;
  const username = req.query.username;

  if (!role || !username) {
    return res.status(401).send("Authentication required");
  }

  req.user = { username, role };
  next();
}

// Socket.io
io.on("connection", (socket) => {
  socket.on("join", (data) => {
    if (data.role === "therapist") {
      socket.join("therapist");
    } else if (data.role === "user") {
      socket.join("user");
    }
    console.log(`${data.username} (${data.role}) connected`);
  });

  socket.on("user-message", (message) => {
    const [username, messageContent] = message.split(": ");
    // if (socket.rooms.has("therapist")) {
    //   io.to("user").emit("message", `Therapist: ${messageContent}`);
    // } else if (socket.rooms.has("user")) {
    //   io.to("therapist").emit("message", `${username}: ${messageContent}`);
    // }
    io.emit("message", `${username}: ${messageContent}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.use(express.static(path.resolve("./")));

app.get("/", (req, res) => {
  res.sendFile(path.resolve("index.html"));
});

app.get("/chat.html", authenticate, (req, res) => {
  res.sendFile(path.resolve("chat.html"));
});

server.listen(9000, () => console.log(`Server Started at PORT:9000`));
