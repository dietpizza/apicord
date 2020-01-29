const production =
  "mongodb+srv://rohan:kepsake550@cluster0-mvzld.azure.mongodb.net/test";
const local = "mongodb://localhost:27017/";

const MongoClient = require("mongodb").MongoClient;
const uuid = require("uuid/v1");

const client = new MongoClient(local, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

class MongoInterface {
  authenticate(username, hash, callback) {
    var response = {
      status: 401,
      user: undefined
    };
    client.connect(err => {
      if (err) {
        response.status = 500;
        callback(response);
        return;
      }
      const users = client.db("cord").collection("users");
      users
        .find({ username })
        .toArray()
        .then(data => {
          if (data.length == 1 && data[0].hash == hash) {
            response.status = 200;
            delete data[0].hash;
            response.user = data[0];
          }
          callback(response);
        });
    });
  }
  addMessages(data) {
    client.connect(err => {
      if (err) {
        console.log("[addMessages]" + err);
        return;
      } else {
        const messages = client.db("cord").collection("messages");
        messages.insertMany(data);
      }
    });
  }
  addUser(user, callback) {
    var response = {
      status: 200
    };
    client.connect(err => {
      if (err) {
        response.status = 500;
        client.close();
        callback(response);
      } else {
        const users = client.db("cord").collection("users");
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
              user.id = uuid();
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
    client.connect(err => {
      if (err) {
        console.log("[getUsers]" + err);
        response.status = 500;
        callback(response);
      } else {
        const users = client.db("cord").collection("users");
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
    client.connect(err => {
      if (err) {
        console.log("[getMessages]" + err);
        response.status = 500;
        callback(response);
      } else {
        const messages = client.db("cord").collection("messages");
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
            console.log(data);
            callback(response);
          });
      }
    });
  }
}

module.exports = MongoInterface;
