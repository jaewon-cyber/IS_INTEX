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


function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// 418 Teapot Route (IS 404 Requirement)
app.get('/teapot', (req, res) => {
    res.status(418).render('teapot');
});



app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { title: 'Login', error: null });
});

// Login Logic
app.post('/login', async (req, res) => {
    // Now req.body will work because of the middleware added above
    const { email, password } = req.body; 

    try {
        const user = await knex('participantinfo') // Changed 'db' to 'knex' to match your variable name
            .where({ participantemail: email }) 
            .first();

        if (user && user.Participantpassword === password) {
            req.session.user = {
                id: user.participantEmail,
                role: user.participantRole
            };
            
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


app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});