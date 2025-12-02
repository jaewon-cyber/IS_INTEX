require("dotenv").config();
const express = require("express");
const path = require('path'); 
const app = express();
const session = require("express-session");

const port = process.env.PORT || 3000;

// --- 1. MIDDLEWARE SETUP (Crucial for fixing req.body undefined error) ---
// Parses HTML form data
app.use(express.urlencoded({ extended: true })); 
// Parses JSON data
app.use(express.json());

// Static files (CSS, Images)
app.use(express.static(path.join(__dirname, 'public')));

// View Engine Setup
app.set("view engine", "ejs");

// --- 2. SESSION SETUP ---
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'fallback-secret-key',
        resave: false,
        saveUninitialized: false,
        // cookie: { secure: true } // Uncomment this line only if using HTTPS
    })
);

// --- 3. DATABASE CONNECTION ---
const knex = require("knex")({
  client: "pg",
  connection: {
      host : process.env.DB_HOST || "localhost",
      user : process.env.DB_USER || "postgres",
      password : process.env.DB_PASSWORD || "admin",
      database : process.env.DB_NAME || "ellarises",
      port : process.env.DB_PORT || 5432,  
      ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false 
  }
});

// Middleware to protect routes
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
  }
  
  // 418 Teapot Route (IS 404 Requirement)
  app.get('/teapot', (req, res) => {
      res.status(418).render('teapot');
  });
  
  // --- LOGIN ROUTES ---
  
  app.get('/login', (req, res) => {
      if (req.session.user) {
          return res.redirect('/');
      }
      res.render('login', { title: 'Login', error: null });
  });
  
  app.post('/login', async (req, res) => {
      const { email, password } = req.body; 
  
      try {
          // Query the database
          const user = await knex('participantinfo')
              .where({ participantemail: email }) 
              .first();
  
          // ✅ DEBUG: Print the user object to Terminal to check column names
          console.log("DB Result:", user); 
  
          // ✅ FIX: Access properties in lowercase (Knex/Postgres standard)
          if (user && user.participantpassword === password) {
              
              // Save session
              req.session.user = {
                  id: user.participantemail,
                  role: user.participantrole
              };
              
              // Save and Redirect
              req.session.save(() => {
                  if (user.participantrole === 'admin') {
                      res.redirect('/admin/donations');
                  } else {
                      res.redirect('/');
                  }
              });
          } else {
              res.render('login', { title: 'Login', error: 'Invalid email or password.' });
          }
      } catch (err) {
          console.error('Login Error:', err);
          res.render('login', { title: 'Login', error: 'Database error occurred.' });
      }
  });
  
  // LOGOUT
  app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
  });
  
  // --- DASHBOARD (HOME) ---
  app.get("/", (req, res) => {
      // Check if user is logged in
      const user = req.session.user;
  
      // Render the index page and pass the user info
      res.render("index", {
          title: "Home - Ella Rises",
          user: user // Pass user object to EJS (will be undefined if not logged in)
      });
  });
  
  // Start Server
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });