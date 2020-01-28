const production =
  "mongodb+srv://rohan:kepsake550@cluster0-mvzld.azure.mongodb.net/test";
const local = "mongodb://localhost:27017/";

const MongoClient = require("mongodb").MongoClient;
const uuid = require("uuid/v1");

const db = new MongoClient(local, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

class MongoInterface {
  authenticate(username, hash, callback) {
    var response = {
      status: 401,
      user: undefined
    };
    db.connect(err => {
      if (err) {
        response.status = 500;
        callback(response);
        return;
      }
      const users = db.db("cord").collection("users");
      users
        .find({})
        .toArray()
        .then(data => {
          data.forEach(el => {
            if (el.username == username && el.hash == hash) {
              delete el.hash;
              response.user = el;
              response.status = 200;
            }
          });
          callback(response);
        });
    });
  }
  addMessages(data) {
    db.connect(err => {
      if (err) {
        console.log("[addMessages]" + err);
        return;
      } else {
        const messages = db.db("cord").collection("messages");
        messages.insertMany(data);
      }
    });
  }
  addUser(user, callback) {
    var response = {
      status: 200
    };
    db.connect(err => {
      if (err) {
        response.status = 500;
        db.close();
        callback(response);
      } else {
        const users = db.db("cord").collection("users");
        users
          .find({})
          .toArray()
          .then(data => {
            data.forEach(el => {
              if (el.username == user.username) {
                response.status = 409;
                callback(response);
                return;
              }
            });
            if (response.status == 200) {
              user._id = uuid();
              users.insertOne(user);
              callback(response);
            }
          });
      }
    });
  }
  getUsers(callback) {
    var response = {
      status: 200,
      users: undefined
    };
    db.connect(err => {
      if (err) {
        console.log("[getUsers]" + err);
        response.status = 500;
        callback(response);
      } else {
        const users = db.db("cord").collection("users");
        users
          .find({})
          .toArray()
          .then(data => {
            response.users = data;
            callback(response);
          });
      }
    });
  }
  getMessages(from, to, callback) {
    var response = {
      status: 200,
      messages: undefined
    };
    db.connect(err => {
      if (err) {
        console.log("[getMessages]" + err);
        response.status = 500;
        callback(response);
      } else {
        const messages = db.db("cord").collection("messages");
        messages
          .find({
            $or: [
              {
                from: from,
                to: to
              },
              {
                from: to,
                to: from
              }
            ]
          })
          .toArray()
          .then(data => {
            response.messages = data;
            callback(response);
          });
      }
    });
  }
}

module.exports = MongoInterface;
