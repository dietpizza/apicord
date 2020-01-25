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
  addUser(user, callback) {
    var response = {
      status: 200
    };
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id	INTEGER PRIMARY KEY AUTOINCREMENT,
        fname	TEXT,
        lname	TEXT,
        username	TEXT,
        email	TEXT,
        hash	TEXT,
        sex	INTEGER
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS messages (
        users	TEXT,
        msg_id	INTEGER,
        sender_id	INTEGER,
        content	TEXT
      )`);
      db.all("SELECT * FROM users", (err, data) => {
        data.forEach(el => {
          if (el.username == user.username || el.email == user.email) {
            response.status = 409;
          }
        });
        if (response.status == 200) {
          db.run(
            `INSERT INTO users (fname,lname,username,email,hash,sex) VALUES (?,?,?,?,?,?)`,
            [
              user.fname,
              user.lname,
              user.username,
              user.email,
              user.hash,
              user.sex
            ]
          );
        }
        callback(response);
      });
    });
  }
  authenticate(username, hash, callback) {
    var response = {
      status: 401,
      user: undefined
    };
    db.all("SELECT * FROM users", (err, users) => {
      if (err) {
        callback(response);
        return;
      }
      users.forEach(user => {
        if (user.username == username && user.hash == hash) {
          delete user.hash;
          response.user = user;
          response.status = 200;
        }
      });
      callback(response);
    });
  }
}

module.exports = DataHandler;
