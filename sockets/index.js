function sockets(server, db) {
  var connectedSockets = [];
  var chatBuffer = [];
  const io = require("socket.io")(server);
  io.on("connection", socket => {
    socket.on("disconnect", () => {
      connectedSockets = connectedSockets.filter(user => user.socket != socket);
      var connectedIDs = [];
      connectedSockets.forEach(el => {
        connectedIDs.push(el.id);
      });
      connectedSockets.forEach(el => {
        el.socket.emit("online-list", connectedIDs);
      });
    });
    socket.on("login", id => {
      connectedSockets.push({ id: id, socket: socket });
      var connectedIDs = [];
      connectedSockets.forEach(el => {
        connectedIDs.push(el.id);
      });
      connectedIDs = [...new Set(connectedIDs)];
      connectedSockets.forEach(el => {
        el.socket.emit("online-list", connectedIDs);
      });
    });
    socket.on("message-send", data => {
      data.status = 1;
      chatBuffer.push(data);
      var targetSockets = connectedSockets.filter(user => {
        return (
          user.id == data.to ||
          (user.id == data.from && user.socket.id != socket.id)
        );
      });
      socket.emit("message-d", data._id);
      console.log("Firing message d");
      targetSockets.forEach(user => {
        user.socket.emit("message-recv", data);
      });
    });
    socket.on("message-r", (ids, from, sentBy) => {
      db.readMessages(ids);
      connectedSockets.forEach(el => {
        if (el.id == from) {
          el.socket.emit("message-rn", ids, sentBy);
          console.log("Firing notifiaction");
          console.log(ids);
        }
      });
    });
    socket.on("typing", data => {
      connectedSockets.forEach(user => {
        if (user.id == data.to) {
          user.socket.emit("typing", data);
        }
      });
    });
  });

  // Asynchronously write messages to DB
  setInterval(() => {
    if (chatBuffer.length > 0) {
      db.addMessages(chatBuffer);
    }
    chatBuffer = [];
  }, 1000);
}

module.exports = sockets;
