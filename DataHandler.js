const DB = require("sqlite3");
var db;
class DataHandler {
  constructor(file) {
    db = new DB.Database(file);
  }
  auth(username, hash, callback) {
    db.each("SELECT * from users", (err, data) => {
      if (username == data.username && hash === data.hash) {
        callback(data);
        return;
      }
    });
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
      data.forEach(user => {
        delete user.hash;
      });
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
}

module.exports = DataHandler;
