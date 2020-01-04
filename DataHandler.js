const DB = require("sqlite3");
const db = new DB.Database("./data/data.db");
class DataHandler {
  auth(username, hash, callback) {
    db.each("SELECT * from users", (err, data) => {
      if (username == data.username) {
        if (hash === data.hash) {
          callback(true, data);
        } else {
          callback(false, {
            error: 401
          });
        }
      } else if (err) {
        callback(err);
      } else {
        callback(false, {
          error: 404
        });
      }
    });
  }
  login(username, hash, callback) {
    this.auth(username, hash, (status, data) => {
      callback(data);
    });
  }
  getChat(src, dest, callback) {
    db.all(`SELECT * FROM '${src}-${dest}';`, (err, data) => {
      if (err) {
        callback(err);
        return;
      }
      callback(data);
    });
  }
  getUsers(callback) {
    db.all("SELECT * FROM users", (err, data) => {
      data.forEach(user => {
        if (user.hash != undefined || user.hash != "") {
          delete user.hash;
        }
      });
      if (err) {
        callback(err);
        return;
      }
      callback(data);
    });
  }
}

module.exports = DataHandler;
