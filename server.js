/* =========================================================
   server.js
   Express server for the Reps&Habits login/registration
   assignment. Serves register.html and login.html as static
   files, and implements the required /register and /login
   POST endpoints against the existing "users" table in the
   workout_tracker MySQL database (same DB used for the
   "Create your User Table" assignment).

   Also adds session-based auth (for the "Using session
   variables for user data" assignment):
     - On successful /login, the username is saved into
       req.session.user.
     - GET /profile reads req.session.user and shows the
       logged-in username, or a "not logged in" message with
       a link to login.html if there's no session.
     - GET /logout destroys the session so the user is
       logged out, then links back to login.html.
   ========================================================= */

require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use(cookieParser());

// Session middleware. The secret is read from .env (SESSION_SECRET)
// so it isn't hardcoded in the source. Cookies last 1 hour and are
// httpOnly so client-side JS can't read them (protects against XSS).
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 60000 * 60, // 1 hour
      httpOnly: true,
      secure: false, // set to true only when served over HTTPS
    },
  })
);

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
        // Save the username in the session so other pages
        // (like /profile) can tell who's logged in.
        req.session.user = { username: username };
        res.send(
          `<p>You have logged in successfully ${username}.<br>` +
            'Visit your <a href="/profile">Profile</a></p>'
        );
      }
    });
  });
});

// ---------------------------------------------------------
// GET /profile
// Shows the logged-in user's username, read from the
// session. If there's no session (not logged in), sends
// a message with a link back to login.html instead.
// ---------------------------------------------------------
app.get("/profile", function (req, res) {
  if (!req.session.user) {
    res.send(
      '<p>You are not logged in. <a href="login.html">Login here</a></p>'
    );
  } else {
    res.send(
      `<p>Hi ${req.session.user.username}, you are logged in.<br>` +
        '<a href="/logout">Logout</a></p>'
    );
  }
});

// ---------------------------------------------------------
// GET /logout
// Destroys the current session, logging the user out.
// ---------------------------------------------------------
app.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      res.send("Error logging out");
    } else {
      res.send(
        'Logged out successfully! <a href="login.html">Login here</a>'
      );
    }
  });
});

app.listen(3000, function () {
  console.log("Server listening on port 3000");
});
