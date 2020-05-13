function routes(db) {
  // Dependencies
  const sha256 = require('sha256');
  const router = require('express').Router();
  const jwt = require('jsonwebtoken');

  // Global Variables
  const JWT_KEY =
    'MFswDQYJKoZIhvcNAQEBBQADSgAwRwJAcwv4YODPmeBsD0h+Um1cVm7rmHNY182BQAN+V74t1+qNHyEVt+SH9CaSzNUFyqrkKZDLCisPF55dEqf6/MSjvQIDAQAB';

  // Custom Middleware
  function authorize(req, res, next) {
    if (req.body.token != undefined) {
      jwt.verify(req.body.token, JWT_KEY, (err, decoded) => {
        if (err) {
          res.status(401).json({ error: 'Not authorized!' });
          return;
        }
        res.locals.user = decoded.user;
        return next();
      });
    } else {
      res.status(401).json({ error: 'Not authorized!' });
      return;
    }
  }

  // The Routes
  router.post('/api/login', (req, res) => {
    db.authenticate(req.body.username, sha256(req.body.passwd), (data) => {
      var response = {
        token: undefined,
      };
      if (data.status == 200) {
        response.token = jwt.sign({ user: data.user }, JWT_KEY);
        res.status(200).json(response);
      } else {
        res.status(401).json({ error: 'Username or password incorrect' });
      }
    });
  });

  router.post('/api/auth', authorize, (req, res) => {
    var response = { token: jwt.sign({ user: res.locals.user }, JWT_KEY) };
    res.json(response);
  });

  router.post('/api/register', (req, res) => {
    var user = {
      fname: req.body.fname,
      lname: req.body.lname,
      username: req.body.username,
      email: req.body.email,
      hash: sha256(req.body.passwd),
      sex: req.body.sex,
    };
    db.addUser(user, (response) => {
      if (response.status == 200) {
        res.status(200).json({ message: 'User Registered!' });
      } else {
        res
          .status(response.status)
          .json({ error: 'Username or email already registered!' });
      }
    });
  });

  router.post('/api/users', authorize, (req, res) => {
    db.getUsers((response) => {
      user = res.locals.user;
      response.users.forEach((user) => {
        delete user.hash;
      });
      response.users = response.users.filter(
        (item) => item.username != user.username
      );
      res.json(response.users);
      return;
    });
  });

  router.post('/api/messages', authorize, (req, res) => {
    user = res.locals.user;
    db.getMessages(user.id, req.body.target, (data) => {
      res.status(data.status).json(data.messages);
    });
  });

  // Catch all 404 requests
  router.post('*', (req, res) => {
    res.status(404).json({ error: 'Page not found!' });
  });

  router.get('*', (req, res) => {
    res.status(404).json({ error: 'Page not found!' });
  });
  return router;
}

module.exports = routes;
