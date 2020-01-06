const express = require("express");
const cors = require("cors");
const DB = require("./DataHandler");
const db = new DB("./data/data.db");
const app = express();

var allUsers = [];
var chatBuffer = [];

db.getUsers(users => {
  console.log("User list loaded");
  allUsers = users;
});

function auth(username, hash, callback) {
  allUsers.forEach(element => {
    if (username == element.username && hash == element.hash) {
      callback(element);
    }
  });
}

// Adding CORS to express
app.use(cors());

// Setting port and middleware (express.json())
var PORT = process.env.PORT || 3000;
app.use(express.json());

// Adding the routes
app.post("/api/users", (req, res) => {
  auth(req.body.username, req.body.hash, data => {
    db.getUsers(users => {
      console.log("Sending User List");
      res.json(users);
      return;
    });
  });
});
app.post("/api/login", (req, res) => {
  auth(req.body.username, req.body.hash, userData => {
    console.log("Sending User Data");
    res.json(userData);
    return;
  });
});
app.post("/api/chats", (req, res) => {
  auth(req.body.username, req.body.hash, data => {
    db.getChat(req.body.src, req.body.dest, data => {
      res.json(data);
    });
  });
});
app.post("/api/chats/add", (req, res) => {
  message = {
    users: req.body.users,
    msg_id: req.body.msg_id,
    sender_id: req.body.sender_id,
    content: req.body.content
  };
  auth(req.body.username, req.body.hash, data => {
    chatBuffer.push(message);
    res.end();
  });
});

app.listen(PORT, () => {
  console.log("Listening on http://localhost:%s", PORT);
});

setInterval(() => {
  if (chatBuffer.length > 0) {
    console.log("Writing messages to db");
    chatBuffer.forEach(message => {
      db.addMessage(message);
    });
  }
  chatBuffer = [];
  console.log(chatBuffer);
}, 500);
