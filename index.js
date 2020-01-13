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
    registerUser,
    logInUser
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

// SLASH Routes //
app.get("/", (req, res) => {
    // req.session.peppermint = "Rhino Randy";
    // console.log("req.session for the slash route: ", req.session.peppermint);
    // console.log("req.session.id for /: ", req.session.signatureId);
    if (req.session.userId) {
        res.redirect("/petition");
    } else if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.redirect("/register");
    }
});

// Register Page Routes //
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    let password = req.body.password;

    hashPass(password).then(hashedPass => {
        let first = req.body.first;
        let last = req.body.last;
        let email = req.body.email;
        // console.log("Hashed Password: ", hashedPass);

        registerUser(first, last, email, hashedPass)
            .then(({ rows }) => {
                req.session.id = rows[0].id;
                res.redirect("/petition");
            })
            .catch(err => {
                let emailTaken = true;
                console.log("Error Code: ", err.code);
                if (err.code === "23505") {
                    res.render("register", { emailTaken });
                } else {
                    console.log("Error in register user page: ", err);
                    res.render("register", { err });
                }
            });
    });
});

// Log-In routes //
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    let email = req.body.email,
        password = req.body.password;

    logInUser(email)
        .then(data => {
            // console.log("Data: ", data[0].password);

            compare(password, data[0].password).then(result => {
                console.log(result);
                if (result === true) {
                    req.session.userId = data[0].id;
                    req.session.first = data[0].first;
                    req.session.last = data[0].last;
                    res.redirect("/petition");
                } else {
                    console.log("compare result: ", result);
                    res.render("login", { passWrong: true });
                }
            });
        })
        .catch(err => {
            console.log("Error in email: ", err);
            res.render("login", { emailWrong: true });
        });
});

// Petition Routes //
app.get("/petition", (req, res) => {
    console.log("GET request reaches petition");
    /////// COOKIES //////
    // req.session.peppermint = "Monkey Martin";
    // console.log("req.session: ", req.session.peppermint);
    //
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("register", {
            // csrfToken: req.csrfToken()
        });
    }
});

app.post("/petition", (req, res) => {
    // add values from user database created at the register page.
    let firstName = req.session.first;
    let lastName = req.session.last;
    let sig = req.body.sig;
    let user_id = req.session.userId;
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

    addSigners(firstName, lastName, sig, timeStamp, consent, user_id)
        .then(returnId => {
            req.session.signatureId = returnId.rows[0].id;
            console.log("Id of new signature: ", returnId.rows[0].id); // returned id to access cookies
        })
        .then(() => {
            res.redirect("/thanks");
        })

        .catch(err => {
            console.log("Error in post: ", err);
            res.render("petition", {
                err
            });
        });
});

// Thank You Page Routes //
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

// Signers Page Routes //
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
