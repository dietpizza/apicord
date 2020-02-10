const uuid = require("uuid/v1");
var client, users, messages;

class MongoInterface {
  constructor(instance) {
    client = instance;
    users = client.db("cord").collection("users");
    messages = client.db("cord").collection("messages");
  }
  authenticate(username, hash, callback) {
    var response = {
      status: 401,
      user: undefined
    };
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
  }
  addMessages(data) {
    messages.insertMany(data);
  }
  addUser(user, callback) {
    var response = {
      status: 200
    };
    users
      .find({
        $or: [
          {
            username: user.username
          },
          {
            email: user.email
          }
        ]
      })
      .toArray()
      .then(data => {
        if (data.length > 0) {
          response.status = 409;
          callback(response);
        } else {
          user.id = uuid();
          users.insertOne(user);
          callback(response);
        }
      });
  }
  getUsers(callback) {
    var response = {
      status: 200,
      users: undefined
    };
    users
      .find({})
      .sort({ fname: 1 })
      .toArray()
      .then(data => {
        response.users = data;
        callback(response);
      });
  }
  getMessages(from, to, callback) {
    var response = {
      status: 200,
      messages: undefined
    };
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
}

module.exports = MongoInterface;
