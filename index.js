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



///// LOGIN /////
app.get("/login", (req, res) => {
  res.render("login", { error: null });
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
            .where({ ParticipantEmail: email }) 
            .first();

        if (user && user.ParticipantPassword === password) {
            req.session.user = {
                id: user.ParticipantEmail,
                role: user.ParticipantRole
            };
            
            req.session.save(() => {
                if (user.ParticipantRole === 'admin') {
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

// //__________________________________________________________________________
// ///// CREATE USER /////
// app.get("/createUser", requireLogin, (req, res) => {
//   res.render("createUser", { error: null });
// });

// app.post("/createUser/add")


// //__________________________________________________________________________
// ///// USERS /////
// app.get("/users", requireLogin, (req, res) => {
//   res.render("users", { error: null });
// });

// app.get("/users/display")

// //*MANAGER*//
// app.post("/user/add")

// app.post("/user/edit")

// app.post("/user/delete")


///// DONATIONS /////
// 5. Donations
// You had two files: donations.ejs (likely for public form) and viewDonations.ejs (admin view)
// app.get('/donate', (req, res) => {
//     res.render('donations', { title: 'Donate' });
// });

// app.get('/admin/donations', (req, res) => {
//     res.render('viewDonations', { title: 'Donation Records' });
// });

// app.post("/donations/addUser")

// app.post("/donations/addDonation")

//____________________________________________________________________
///// VIEW DONATIONS /////
// app.get("/viewDonations", requireLogin, (req, res) => {
//   res.render("viewDonations", { error: null });
// });

// app.get("/viewDonations/volunteers")


// //*MANAGER*//
// app.post("/viewDonation/add")

// app.post("/viewDonation/edit")

// app.post("/viewDonation/delete")

//_______________________________________________________________________
///// EVENTS //////
// app.get("/events", requireLogin, (req, res) => {
//   res.render("events", { error: null });
// });

// app.get("/events/display") // display all current event 


// //*MANAGER*//
// app.post("/event/add")

// app.post("/event/edit")

// app.post("/event/delete")

//_________________________________________________________________________
///// MILESTONES /////
// app.get("/milestones", requireLogin, (req, res) => {
//   res.render("milestones", { error: null });
// });

// app.get("/milestones/display")

// //*MANAGER*//
// app.post("/milestone/add")

// app.post("/milestone/edit")

// app.post("/milestone/delete")


//________________________________________________________________________
///// PARTICIPANTS /////
// 4. Main Entities (CRUD)
// app.get('/participants', (req, res) => {
//     res.render('participants', { title: 'Participants' });
// });

// //display all participants, search function
// app.get("/participants/display")

// //maintain milestones for participants 
// app.post("/participants/milestones")

// //*MANAGER*//
// app.post("/participant/add")

// app.post("/participant/edit")

// app.post("/participant/delete")


//________________________________________________________________________
///// SURVEYS /////
// app.get("/surveys", requireLogin, (req, res) => {
//   res.render("surveys", { error: null });
// });

// app.get("/surveys/display")

// //*MANAGER*//
// app.post("/survey/add")

// app.post("/survey/edit")

// app.post("/survey/delete")


// START SERVER
// Launch the Express server on the specified port (default: 3000)
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});