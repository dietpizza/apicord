// Dependencies
const express = require("express");
const cors = require("cors");
const sha256 = require("sha256");
const jwt = require("jsonwebtoken");

// Relative dependencies
const MongoDB = require("./db");
const db = new MongoDB("./data/data.db");

// Express instance
const app = express();

// Scratch Variables
var chatBuffer = [];
var connectedUsers = [];

// Adding middlewares to express instance
app.use(cors());
app.use(express.json());

// Custom Middlewares
function authorize(req, res, next) {
  if (req.body.token != undefined) {
    jwt.verify(req.body.token, KEY, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: "Not authorized!" });
        return;
      }
      res.locals.user = decoded.user;
      return next();
    });
  } else {
    res.status(401).json({ error: "Not authorized!" });
    return;
  }
}

// Global Variables
const PORT = process.env.PORT || 3000;
const KEY = "imrohan550@gmail.com";

// Asynchronous write messages to DB
setInterval(() => {
  if (chatBuffer.length > 0) {
    db.addMessages(chatBuffer);
  }
  chatBuffer = [];
}, 1000);

// The Routes
app.post("/api/login", (req, res) => {
  var loggedin = false;
  db.authenticate(req.body.username, sha256(req.body.passwd), data => {
    var response = {
      token: undefined
    };
    if (data.status == 200) {
      connectedUsers.forEach(el => {
        if (el.id == data.user.id) {
          res
            .status(409)
            .json({ error: "Already logged in on another device" });
          loggedin = true;
        }
      });
      if (loggedin == false) {
        response.token = jwt.sign({ user: data.user }, KEY, {
          expiresIn: 604800
        });
        res.status(200).json(response);
      }
    } else {
      res.status(data.status).json({ error: "Username or password incorrect" });
    }
  });
});
app.post("/api/register", (req, res) => {
  var user = {
    fname: req.body.fname,
    lname: req.body.lname,
    username: req.body.username,
    email: req.body.email,
    hash: sha256(req.body.passwd),
    sex: req.body.sex
  };
  db.addUser(user, response => {
    if (response.status == 200) {
      res.status(200).json({ message: "User Registered!" });
    } else {
      res
        .status(response.status)
        .json({ error: "Username or email already registered!" });
    }
  });
});
app.post("/api/users", authorize, (req, res) => {
  db.getUsers(users => {
    user = res.locals.user;
    users.forEach(user => {
      delete user.hash;
    });
    users = users.filter(item => item.username != user.username);
    res.json(users);
    return;
  });
});
app.post("/api/chats", authorize, (req, res) => {
  user = res.locals.user;
  db.getMessages(user._id, req.body.target, data => {
    res.json(data);
  });
});

// Catch all 404 requests
app.post("*", (req, res) => {
  res.status(404).json({ error: "Page not found!" });
});
app.get("*", (req, res) => {
  res.status(404).json({ error: "Page not found!" });
});

// Setting up the server
const server = app.listen(PORT, () => {
  console.log("Server running at " + PORT);
});

// Socket.io
const io = require("socket.io")(server);
io.on("connection", socket => {
  socket.on("disconnect", () => {
    connectedUsers = connectedUsers.filter(user => user.socket != socket);
    var connectedIDs = [];
    connectedUsers.forEach(el => {
      connectedIDs.push(el.id);
    });
    connectedUsers.forEach(el => {
      el.socket.emit("online-list", connectedIDs);
    });
  });
  socket.on("login", id => {
    connectedUsers = [...connectedUsers, { id: id, socket: socket }];
    var connectedIDs = [];
    connectedUsers.forEach(el => {
      connectedIDs.push(el.id);
    });
    connectedUsers.forEach(el => {
      el.socket.emit("online-list", connectedIDs);
    });
  });
  socket.on("message-send", data => {
    var tmp = connectedUsers.find(user => user.id == data.dest_id);
    chatBuffer.push(data);
    if (tmp != undefined) {
      tmp.socket.emit("message-recv", data);
    }
  });
});
