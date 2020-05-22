// Dependencies
const express = require('express');
const cors = require('cors');

// Relative dependencies
const socketio = require('./sockets');
const MongoInterface = require('./db');
const MongoDB = require('mongodb').MongoClient;
const { MONGO_URI } = require('./config');

// Global Variables
const PORT = process.env.PORT || 3000;

// MongoDB config
var db = undefined;
const client = new MongoDB(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  poolSize: 10,
});

// Express instance
const app = express();

// Adding middlewares to express instance
app.use(cors());
app.use(express.json());
// Connecting to MongoDB
client.connect((err) => {
  if (err) {
    console.log('Error connecting to MongoDB.');
    process.exit(0);
  } else {
    db = new MongoInterface(client);
    // Cleanup function
    const cleanup = function () {
      client.close().then(() => {
        console.log('\nConnection to MongoDB closed.');
        process.exit(0);
      });
    };
    // Starting express server
    const server = app.listen(PORT, () => {
      console.log('Server running at port: ' + PORT);
      process.on('SIGTERM', cleanup);
      process.on('SIGINT', cleanup);
    });
    const routes = require('./routes')(db);
    app.use('/', routes);
    // Socket.io
    socketio(server, db);
  }
});
