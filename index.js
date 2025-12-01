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

// Knex PostgreSQL database configuration
const knex = require("knex")({
    client: "pg",
    connection: {
        host : "localhost",
        user : "postgres",
        password : "admin1234",
        database : "studygroup",
        port : 5432
    }
});

// Ryan: I had to use this method to query from the database
// const knex = require("knex")({
//     client: "pg",
//     connection: {
//         host : process.env.DB_HOST || "localhost",
//         user : process.env.DB_USER || "postgres",
//         password : process.env.DB_PASSWORD || "admin1234",
//         database : process.env.DB_NAME || "studygroup",
//         port : process.env.DB_PORT || 5432  // PostgreSQL 16 typically uses port 5434
//     }
// });

// Authentication Middleware to protect routes
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next(); 
    } else {
        res.redirect("/login");
    }
};

// Render Login Page
app.get("/login", (req, res) => {
    const error = req.session.error || null; 
    req.session.error = null; 
    res.render("login", { error: error });
});

//  Handle Login Attempt
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await knex('credentials')
            .where({
                username: username,
                password: password
            })
            .select('student_id', 'username') ///////////
            .first(); 
        
        if (user) {
            req.session.userId = user.student_id;   ////////// 
            req.session.username = user.username; 
            
            
            req.session.save(() => {
                res.redirect("/"); 
            });
        } else {
            
            req.session.error = "Invalid username or password.";
            
            
            req.session.save(() => {
                res.redirect("/login");
            });
        }
    } catch (err) {
        console.error("Login Error:", err);
        req.session.error = "An unexpected error occurred during login.";
        req.session.save(() => {
            res.redirect("/login");
        });
    }
});

// Logout Handler
app.get("/logout", (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if(err){
            console.log(err);
        }
        else {
            // Redirect to the dashboard after logout
            res.redirect("/"); 
        }
    });
});


// START SERVER
// Launch the Express server on the specified port (default: 3000)
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
