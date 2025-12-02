require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require('path'); 
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
const port = process.env.PORT || 3000;
const session = require("express-session");
const bcrypt = require('bcrypt'); // Make sure to require this at the top


// Session configuration
app.use(
    session(
        {
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
        }
    )
);


const knex = require("knex")({
    client: "pg",
    connection: {
        host : process.env.DB_HOST || "localhost",
        user : process.env.DB_USER || "postgres",
        password : process.env.DB_PASSWORD || "admin",
        database : process.env.DB_NAME || "ellarised",
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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await knex("users")
    .where({ username, password })
    .first();

  if (!user) {
    return res.render("login", { error: "Invalid login." });
  }

  req.session.user = user;
  res.redirect("/");
});

  // Render Login Page
  app.get("/login", (req, res) => {
      const error = req.session.error || null; 
      req.session.error = null; 
      res.render("login", { error: error });
  });
  
// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

//__________________________________________________________________________
///// CREATE USER /////
app.get("/createUser", requireLogin, (req, res) => {
  res.render("createUser", { error: null });
});

app.post("/createUser/add")


//__________________________________________________________________________
///// USERS /////
app.get("/users", requireLogin, (req, res) => {
  res.render("users", { error: null });
});

app.get("/users/display")

//*MANAGER*//
app.post("/user/add")

app.post("/user/edit")

app.post("/user/delete")


///// DONATIONS /////
// 5. Donations
// You had two files: donations.ejs (likely for public form) and viewDonations.ejs (admin view)
app.get('/donate', (req, res) => {
    res.render('donations', { title: 'Donate' });
});

app.get('/admin/donations', (req, res) => {
    res.render('viewDonations', { title: 'Donation Records' });
});

app.post("/donations/addUser")

app.post("/donations/addDonation")

//____________________________________________________________________
///// VIEW DONATIONS /////
app.get("/viewDonations", requireLogin, (req, res) => {
  res.render("viewDonations", { error: null });
});

app.get("/viewDonations/volunteers")


//*MANAGER*//
app.post("/viewDonation/add")

app.post("/viewDonation/edit")

app.post("/viewDonation/delete")

//_______________________________________________________________________
///// EVENTS //////
app.get("/events", requireLogin, (req, res) => {
  res.render("events", { error: null });
});

app.get("/events/display") // display all current event 


//*MANAGER*//
app.post("/event/add")

app.post("/event/edit")

app.post("/event/delete")

//_________________________________________________________________________
///// MILESTONES /////
app.get("/milestones", requireLogin, (req, res) => {
  res.render("milestones", { error: null });
});

app.get("/milestones/display")

//*MANAGER*//
app.post("/milestone/add")

app.post("/milestone/edit")

app.post("/milestone/delete")


//________________________________________________________________________
///// PARTICIPANTS /////
// 4. Main Entities (CRUD)
app.get('/participants', (req, res) => {
    res.render('participants', { title: 'Participants' });
});

//display all participants, search function
app.get("/participants/display")

//maintain milestones for participants 
app.post("/participants/milestones")

//*MANAGER*//
app.post("/participant/add")

app.post("/participant/edit")

app.post("/participant/delete")


//________________________________________________________________________
///// SURVEYS /////
app.get("/surveys", requireLogin, (req, res) => {
  res.render("surveys", { error: null });
});

app.get("/surveys/display")

//*MANAGER*//
app.post("/survey/add")

app.post("/survey/edit")

app.post("/survey/delete")


// START SERVER
// Launch the Express server on the specified port (default: 3000)
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});