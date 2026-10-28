/* =========================================================
   server.js
   Express server for the Reps&Habits login/registration
   assignment. Serves register.html and login.html as static
   files, and implements the required /register and /login
   POST endpoints against the existing "users" table in the
   workout_tracker MySQL database (same DB used for the
   "Create your User Table" assignment).
   ========================================================= */

require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const SALT_ROUNDS = 10;

// Connection to the same workout_tracker database/users table
// set up for the earlier database assignment.
const conn = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

conn.connect(function (err) {
  if (err) console.log("Couldn't connect to MySQL", err);
  else console.log("Database connection established");
});

// ---------------------------------------------------------
// POST /register
// Creates a new user row with a bcrypt-hashed password.
// On success, confirms registration and links to login.html.
// ---------------------------------------------------------
app.post("/register", function (req, res) {
  const username = req.body.username;
  const email = req.body.email;
  const plainPass = req.body.password;

  bcrypt.hash(plainPass, SALT_ROUNDS, function (hashErr, hashedPass) {
    if (hashErr) {
      console.log("Error hashing password", hashErr);
      res.send("<p>Something went wrong during registration.</p>");
      return;
    }

    const sql =
      "insert into users (username, email, password_hash) values (?, ?, ?)";
    conn.query(sql, [username, email, hashedPass], function (err, result) {
      if (err) {
        console.log("There was an error inserting a user", err);
        res.send(
          "<p>Registration failed - that username or email may already be taken. " +
            '<a href="register.html">Try again</a></p>'
        );
      } else {
        res.send(
          "<p>You have successfully registered. " +
            '<a href="login.html">Login</a> here</p>'
        );
      }
    });
  });
});

// ---------------------------------------------------------
// POST /login
// Verifies the submitted username/password against the
// stored bcrypt hash.
// ---------------------------------------------------------
app.post("/login", function (req, res) {
  const username = req.body.username;
  const plainPass = req.body.password;

  const sql = "select * from users where username = ?";
  conn.query(sql, [username], function (err, result) {
    if (err) {
      res.send(err.message);
      return;
    }

    if (result.length === 0) {
      res.send(
        '<p>The login credentials were incorrect. <a href="login.html">Login</a> here</p>'
      );
      return;
    }

    const user = result[0];
    bcrypt.compare(plainPass, user.password_hash, function (compareErr, match) {
      if (compareErr || !match) {
        res.send(
          '<p>The login credentials were incorrect. <a href="login.html">Login</a> here</p>'
        );
      } else {
        res.send(`<p>You have logged in successfully ${username}</p>`);
      }
    });
  });
});

app.listen(3000, function () {
  console.log("Server listening on port 3000");
});
