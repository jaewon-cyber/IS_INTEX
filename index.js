require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
const port = process.env.PORT || 3000;

const session = require("express-session");

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

function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// 418 Teapot Route (IS 404 Requirement)
app.get('/teapot', (req, res) => {
    res.status(418).render('teapot');
});


///// DONATIONS /////
app.get("/donations", requireLogin, (req, res) => {
  res.render("donations", { error: null });
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
app.get("/participants", requireLogin, (req, res) => {
  res.render("participants", { error: null });
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

// START SERVER
// Launch the Express server on the specified port (default: 3000)
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});