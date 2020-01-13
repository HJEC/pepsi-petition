const express = require("express");
const app = express();
const hb = require("express-handlebars");
// const cp = require('cookie-parser');
//security //
const cookieSession = require("cookie-session");
const { SESSION_SECRET: sessionSecret } = require("./secrets.json");
const csurf = require("csurf");
const helmet = require("helmet");
const { compare, hashPass } = require("./bcrypt");
// security //
//functions//
const {
    userSig,
    getSigners,
    addSigners,
    registerUser
} = require("./extFunctions");
//functions//
app.use(helmet());

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(
    cookieSession({
        secret: sessionSecret,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(csurf()); // CSURF middleware to look for valid secret TOKEN. This adds CSRF Token to request object.

app.use(function(req, res, next) {
    res.set("x-frame-options", "DENY"); // set headers to stop clickjacking with iframe windows
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.get("/", (req, res) => {
    console.log("You went to the slash route");
    //
    // req.session.peppermint = "Rhino Randy";
    // console.log("req.session for the slash route: ", req.session.peppermint);
    // console.log("req.session.id for /: ", req.session.signatureId);
    //
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    let first = req.body.first;
    let last = req.body.last;
    let email = req.body.email;
    let password = req.body.password;

    hashPass(password).then(hashedPass => {
        console.log("Hashed Password: ", hashedPass);
        registerUser(first, last, email, hashedPass)
            .then(({ rows }) => {
                req.session.id = rows[0].id;
                res.redirect("/petition");
            })
            .catch(err => {
                console.log("Error in register user page: ", err);
                res.render("register", { err });
            });
    });
});

app.get("/petition", (req, res) => {
    console.log("GET request reaches petition");
    // console.log("Session Secret: ", sessionSecret);
    //
    /////// COOKIES //////
    // req.session.peppermint = "Monkey Martin";
    // console.log("req.session: ", req.session.peppermint);
    //
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            // csrfToken: req.csrfToken()
        });
    }
});

app.post("/petition", (req, res) => {
    let firstName = req.body.first;
    let lastName = req.body.last;
    let sig = req.body.sig;
    //
    let date = new Date();
    let timeStamp = `${date.getFullYear()} - ${date.getMonth() +
        1} -  ${date.getDate()}`;
    //
    let consent;
    if (req.body.consent[1] === "clicked") {
        consent = req.body.consent[1];
    } else {
        consent = req.body.consent;
    }

    addSigners(firstName, lastName, sig, timeStamp, consent)
        .then(returnId => {
            req.session.signatureId = returnId.rows[0].id;
            console.log("Id of new signature: ", returnId.rows[0].id); // returned id to access cookies
            res.redirect("/thanks");
        })
        .catch(err => {
            console.log("Error in post: ", err);
            res.render("petition", {
                err
            });
        });
});

app.get("/thanks", (req, res) => {
    let id = req.session.signatureId;
    console.log("ID: ", id);
    userSig(id)
        .then(result => {
            let sig = result[0].signature,
                first = result[0].first;

            res.render("thanks", { sig, first });
        })
        .catch(err => {
            "Error in displaying signature: ", err;
        });
});

app.post("/thanks", (req, res) => {
    res.redirect("signers");
});

app.get("/signers", (req, res) => {
    getSigners()
        .then(data => {
            res.render("signers", {
                data
            });
        })
        .catch(err => {
            console.log("error in Thanks post: ", err);
        });
});

app.listen(8080, () => console.log("Petition server is listening"));
