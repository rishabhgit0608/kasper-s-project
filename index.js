const http = require('http'); // server
const express = require('express');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors'); // Add CORS for cross-origin requests

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080', // Allow requests from your frontend
    methods: ['GET', 'POST'],
  },
});

// Basic Authentication (Replace with a database in production)
const users = {
  user1: 'user1_password',
  tushar: "tugpass"
};

const therapists = {
  therapist: 'therapist_password',
}

app.use(express.json()); // Add this line to parse JSON bodies

// Authentication route (handles login requests)
app.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  let data;
  if(role === "user") data = users;
  else if (role === "therapist") data = therapists;
  else return res.status(401).send('Invalid credentials');
  if (!(username in data) || data[username] !== password) {
    return res.status(401).send('Invalid credentials');
  }
  res.sendStatus(200); // Send 200 OK on successful login
});

app.post('/signup', (req, res) => {
  const { username, password, role } = req.body;
  let data;
  if(role === "user" && !users[username]) users.push({username: password});
  else if (role === "therapist" && !therapists[username]) therapists.push({username: password});
  else return res.status(401).send('User already there.');
  res.sendStatus(200); // Send 200 OK on successful login
});

// Middleware to serve static files
app.use(express.static(path.resolve('./')));

// Socket.IO Logic
io.on('connection', (socket) => {
  socket.on('join', (data) => {
    const { role, username } = data;
    socket.join(role);
    socket.join(`${role}-${username}`); // Room for specific role and username
    socket.emit('connected', { message: `Welcome, ${username}!` }); // Send welcome message
    console.log(`${username} (${role}) connected`);
  });

  socket.on('user-message', (message) => {
    const [username, messageContent] = message.split(': ');
    // if (socket.rooms.has("therapist")) {
    //   io.to("user").emit("message", `Therapist: ${messageContent}`);
    // } else if (socket.rooms.has("user")) {
    //   io.to("therapist").emit("message", `${username}: ${messageContent}`);
    // }
    io.emit("message", `${username}: ${messageContent}`);
  });

  socket.on('disconnect', () => {
    const user = socket.rooms.values().next().value; // Get username from room
    console.log(`${user} disconnected`);
    socket.leave(user); // Leave the username room
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.resolve('index.html'));
});

server.listen(9000, () => console.log(`Server Started at PORT:9000`));