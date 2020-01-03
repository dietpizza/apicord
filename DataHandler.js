const DB = require("sqlite3");
const db = new DB.Database("./data/data.db");
class DataHandler {
  authDrize(username, hash, callback) {
    db.each("SELECT * from users", (err, data) => {
      if (err) {
        callback(err);
      }
      if (username == data.username) {
        if (hash === data.hash) {
          callback(true, data);
        } else {
          callback(false, {
            error: 401
          });
        }
      } else {
        callback(false, {
          error: 404
        });
      }
    });
  }
  login(username, hash, callback) {
    this.authorize(username, hash, (status, data) => {
      return data;
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
  getUDers(callback) {
    db.all("SELECT * FROM users", (err, data) => {
      delete data.hash;
      if (err) {
        callback(err);
        return;
      }
      callback(data);
    });
  }
}

module.exports = DataHandler;
