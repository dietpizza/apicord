const express = require("express");
const cors = require("cors");
const DB = require("./DataHandler");
const db = new DB("./data/data.db");
const app = express();

// Adding CORS to express
app.use(cors());

// Setting port and middleware (express.json())
var PORT = process.env.PORT || 3000;
app.use(express.json());

// Adding the routes
app.post("/api/users", (req, res) => {
  db.auth(req.body.username, req.body.hash, data => {
    db.getUsers(users => {
      console.log("Sending User List");
      res.json(users);
      return;
    });
  });
});
app.post("/api/login", (req, res) => {
  db.auth(req.body.username, req.body.hash, userData => {
    console.log("Sending User Data");
    res.json(userData);
    return;
  });
});
app.post("/api/chats", (req, res) => {
  db.auth(req.body.username, req.body.hash, data => {
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
  db.auth(req.body.username, req.body.hash, data => {
    console.log(message);
    db.addMessage(message);
    res.end();
  });
});

app.listen(PORT, () => {
  console.log("Listening on http://localhost:%s", PORT);
});
