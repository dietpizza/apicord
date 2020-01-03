const express = require("express");
const cors = require("cors");
const DB = require("./DataHandler");
const db = new DB();

const app = express();
app.use(cors());

var PORT = process.env.PORT || 3000;

app.get("/api/users/:username/:hash", (req, res) => {
  db.authorize(username, hash, (status, data) => {
    if (status) {
      db.getUsers(data => {
        data.forEach(element => {
          if (element.hash != undefined || element.hash != "") {
            delete element.hash;
          }
        });
        res.json(data);
      });
    }
  });
});
app.get("/api/login/:username/:hash", (req, res) => {
  var username = req.params.username,
    hash = req.params.hash;
  db.login(username, hash, (status, dat) => {
    res.json(data);
  });
});
app.get("/api/chats/:username/:hash/:src/:dest", (req, res) => {
  var username = req.params.username,
    hash = req.params.hash,
    src = req.params.src,
    dest = req.params.dest;
  db.authorize(username, hash, (status, dat) => {
    if (status) {
      db.getChat(src, dest, data => {
        res.json(data);
      });
    } else {
      res.json({
        error: 401
      });
    }
  });
});

app.listen(PORT, () => {
  console.log("Listening on http://localhost:%s", PORT);
});
