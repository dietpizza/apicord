const express = require('express');
const cors = require('cors');

const sockets = require('./sockets');
const MongoInterface = require('./db');
const MongoDB = require('mongodb').MongoClient;
const { MONGO_URI } = require('./config');

const PORT = process.env.PORT || 3000;

const client = new MongoDB(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  poolSize: 10,
});
const app = express();

app.use(cors());
app.use(express.json());

const cleanup = function () {
  client.close().then(() => {
    console.log('\nConnection to MongoDB closed.');
    process.exit(0);
  });
};

client.connect((err) => {
  if (err) {
    console.log('Error connecting to MongoDB.');
    process.exit(0);
  } else {
    console.log('Connected to MongoDB');
    var db = new MongoInterface(client);
    const server = app.listen(PORT, () => {
      console.log('Server running at port: ' + PORT);
      process.on('SIGTERM', cleanup);
      process.on('SIGINT', cleanup);
    });
    const routes = require('./routes')(db);
    app.use('/', routes);
    sockets(server, db);
  }
});
