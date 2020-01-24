const DB = require("sqlite3");
var db;
class DataHandler {
  constructor(file) {
    db = new DB.Database(file);
  }
  getChat(src, dest, callback) {
    db.all(
      `SELECT * FROM messages where users='${src}-${dest}' OR users='${dest}-${src}'`,
      (err, data) => {
        if (err) {
          callback(err);
          return;
        }
        callback(data);
        return;
      }
    );
  }
  getUsers(callback) {
    db.all("SELECT * FROM users", (err, data) => {
      if (err) {
        callback(err);
        return;
      }
      callback(data);
    });
  }
  addMessage(message) {
    db.run(
      `INSERT INTO messages (users,msg_id,sender_id,content) VALUES (?,?,?,?)`,
      [message.users, message.msg_id, message.sender_id, message.content]
    );
  }
  addUser(user) {
    db.run(
      `INSERT INTO users (fname,lname,username,email,hash,sex) VALUES (?,?,?,?,?,?)`,
      [user.fname, user.lname, user.username, user.email, user.hash, user.sex]
    );
  }
  authenticate(username, hash, callback) {
    var response = {
      status: 200,
      user: {}
    };
    db.each("SELECT * FROM users", (err, user) => {
      if (err) {
        response.status = 500;
      }
      if (user.username == username && user.hash == hash) {
        delete user.hash;
        response.user = user;
        callback(response);
      }
    });
    return response;
  }
}

module.exports = DataHandler;
