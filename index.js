require("dotenv").config();
const express = require("express");
const path = require('path');
const app = express();
const session = require("express-session");

const port = process.env.PORT || 3000;

// --- 1. MIDDLEWARE SETUP ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");

// --- 2. SESSION SETUP ---
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'ellarises-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 }
    })
);

// --- 3. DATABASE CONNECTION ---
const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "admin",
        database: process.env.DB_NAME || "ellarises",
        port: process.env.DB_PORT || 5432,
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
    }
});

// --- 4. CUSTOM MIDDLEWARE ---
const isLogged = (req, res, next) => {
    if (req.session.user) {
        res.locals.user = req.session.user;
        next();
    } else {
        res.redirect('/login');
    }
};

const isManager = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'manager' || req.session.user.role === 'admin')) {
        next();
    } else {
        res.status(403).send("Access Denied.");
    }
};

// --- ROUTES ---

// 1. Landing Page
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'Home - Ella Rises', 
        user: req.session.user || null 
    });
});

// 2. Authentication
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login', error: null });
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // 소문자 컬럼명 사용 (participantemail)
        const user = await knex('participantinfo').where({ participantemail: email }).first();
        
        if (user && user.participantpassword === password) {
            req.session.user = {
                id: user.participantemail,
                role: user.participantrole // role도 소문자
            };
            req.session.save(() => res.redirect('/'));
        } else {
            res.render('login', { title: 'Login', error: 'Invalid email or password.' });
        }
    } catch (err) {
        console.error(err);
        res.render('login', { title: 'Login', error: 'Database error.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// 3. User Maintenance
app.get('/users', isLogged, isManager, async (req, res) => {
    const search = req.query.search || '';
    try {
        const users = await knex('participantinfo')
            .where('participantemail', 'ilike', `%${search}%`) // 컬럼명 소문자
            .orderBy('participantid');
        
        res.render('users', { title: 'User Maintenance', users, search });
    } catch (err) { console.error(err); res.send(err.message); }
});

// 4. Participants Maintenance
app.get('/participants', isLogged, async (req, res) => {
    const search = req.query.search || '';
    try {
        const participants = await knex('participantinfo')
            .where(builder => {
                if(search) builder.where('participantemail', 'ilike', `%${search}%`);
            })
            .orderBy('participantid');

        res.render('participants', { title: 'Participants', participants, search });
    } catch (err) { console.error(err); res.send(err.message); }
});

app.post('/participants/delete/:id', isLogged, isManager, async (req, res) => {
    try {
        await knex('participantinfo').where({ participantid: req.params.id }).del();
        res.redirect('/participants');
    } catch (err) { console.error(err); res.send("Error deleting participant."); }
});

// 5. Events Maintenance
app.get('/events', isLogged, async (req, res) => {
    const search = req.query.search || '';
    try {
        // 테이블명도 DB 실제 이름 확인 필요 (보통 소문자 추천)
        const events = await knex('eventtemplates') 
            .where('eventname', 'ilike', `%${search}%`)
            .orderBy('eventtemplateid');
        res.render('events', { title: 'Events', events, search });
    } catch (err) { console.error(err); res.send(err.message); }
});

// 6. Milestones Maintenance
app.get('/milestones', isLogged, async (req, res) => {
    const search = req.query.search || '';
    try {
        const milestones = await knex('milestones')
            .where('milestonetitle', 'ilike', `%${search}%`)
            .orderBy('milestoneid');
        res.render('milestones', { title: 'Milestones', milestones, search });
    } catch (err) { console.error(err); res.send(err.message); }
});

// 7. Post Surveys
app.get('/surveys', isLogged, async (req, res) => {
    try {
        const surveys = await knex('surveyresponses')
            .join('surveyquestions', 'surveyresponses.questionid', 'surveyquestions.questionid')
            .select('surveyresponses.*', 'surveyquestions.question')
            .limit(50);
        res.render('surveys', { title: 'Survey Results', surveys });
    } catch (err) { console.error(err); res.send(err.message); }
});

// 8. Donations (Admin)
app.get('/admin/donations', isLogged, isManager, async (req, res) => {
    const search = req.query.search || '';
    try {
        const donations = await knex('participantdonations')
            .join('participantinfo', 'participantdonations.participantid', 'participantinfo.participantid')
            .select('participantdonations.*', 'participantinfo.participantemail', 'participantinfo.participantfirstname')
            .orderBy('donationdate', 'desc');

        res.render('viewDonations', { title: 'Donation Records', donations, search });
    } catch (err) { console.error(err); res.send(err.message); }
});

// Donation Public Page
app.get('/donate', (req, res) => {
    res.render('donations', { title: 'Donate', user: req.session.user || null });
});

// 418 Teapot
app.get('/teapot', (req, res) => {
    res.status(418).render('teapot', { title: '418' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});