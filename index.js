// Dependencies
const express = require("express");
const cors = require("cors");
const sha256 = require("sha256");
const jwt = require("jsonwebtoken");

// Relative dependencies
const MongoInterface = require("./db");
const MongoDB = require("mongodb").MongoClient;

// MongoDB config
var db = undefined;
const atlas =
  "mongodb+srv://rohan:kepsake550@cluster0-mvzld.azure.mongodb.net/";
const dev =
  "mongodb://uivdc0kcbp94j7lrfxl3:INyrOMbGBnu8JL96jI24@bzfx2jogqlgwafr-mongodb.services.clever-cloud.com:27017/bzfx2jogqlgwafr";
const client = new MongoDB(atlas, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  poolSize: 20
});

// Express instance
const app = express();

// Cleanup function
const cleanup = function() {
  client.close().then(() => {
    console.log("\nConnection to MongoDB closed.");
    process.exit(0);
  });
};

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
const KEY =
  "MIGJAoGBAIHgPBj0Z5JaGdSrHYEHgmposxsgO8T4xE3sXPSKuooFwghrx3FbZgrUY4urknp0sPtAwPjSC4/5ZP4M29sexrkd1McaAP6lTiJImSIqpWIpMTqxSi240yL4SmiAaeI9oxzdkBSSMaz+hdAO2qcBTkWHBOYsDyaNN8vlKOouXk9RAgMBAAE=";

// Connecting to MongoDB and staring server
client.connect(err => {
  if (err) {
    console.log("Error connecting to MongoDB.");
    process.exit(0);
  } else {
    db = new MongoInterface(client);
    const server = app.listen(PORT, () => {
      console.log("Server running at port: " + PORT);
      process.on("SIGTERM", cleanup);
      process.on("SIGINT", cleanup);
    });
    // Socket IO
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
        connectedUsers.push({ id: id, socket: socket });
        var connectedIDs = [];
        connectedUsers.forEach(el => {
          connectedIDs.push(el.id);
        });
        connectedUsers.forEach(el => {
          el.socket.emit("online-list", connectedIDs);
        });
      });
      socket.on("message-send", data => {
        chatBuffer.push(data);
        var tmpUsers = connectedUsers.filter(user => {
          user.id == data.to || (user.socket != socket && user.id == data.from);
        });
        tmpUsers.forEach(user => {
          user.socket.emit("message-recv", data);
        });
      });
      socket.on("typing", data => {
        connectedUsers.forEach(user => {
          if (user.id == data.to) {
            user.socket.emit("typing", data);
          }
        });
      });
    });
  }
});

// Asynchronously write messages to DB
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
      response.token = jwt.sign({ user: data.user }, KEY, {
        expiresIn: 604800
      });
      res.status(200).json(response);
    } else {
      res.status(401).json({ error: "Username or password incorrect" });
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
  db.getUsers(response => {
    user = res.locals.user;
    response.users.forEach(user => {
      delete user.hash;
    });
    response.users = response.users.filter(
      item => item.username != user.username
    );
    res.json(response.users);
    return;
  });
});
app.post("/api/messages", authorize, (req, res) => {
  user = res.locals.user;
  db.getMessages(user.id, req.body.target, data => {
    res.status(data.status).json(data.messages);
  });
});

// Catch all 404 requests
app.post("*", (req, res) => {
  res.status(404).json({ error: "Page not found!" });
});
app.get("*", (req, res) => {
  res.status(404).json({ error: "Page not found!" });
});
