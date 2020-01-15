const express = require("express");
const app = express();
const hb = require("express-handlebars");
// const cp = require('cookie-parser');

//security //
const cookieSession = require("cookie-session");
// const { SESSION_SECRET: sessionSecret } = require("./secrets.json");
let secrets;
if (process.env.NODE_ENV === "production") {
    secrets = process.env;
} else {
    secrets = require("./secrets.json");
}

const csurf = require("csurf");
const helmet = require("helmet");
const { compare, hashPass } = require("./bcrypt");
// security //

//functions//
const {
    registerUser,
    logInUser,
    addProfile,
    addSigners,
    userSig,
    getSigners,
    getSignersByCity
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
        secret: secrets.SESSION_SECRET,
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
    console.log("userid:", req.session.userId);
    console.log("profile id:", req.session.profileId);
    console.log("signature id:", req.session.signatureId);
    if (req.session.userId) {
        if (req.session.profileId) {
            if (req.session.signatureId) {
                res.redirect("/thanks");
            } else {
                res.redirect("/petition");
            }
        } else {
            res.redirect("/profile");
        }
    } else {
        res.redirect("/register");
    }
});

// else if (req.session.signatureId) {
//     res.redirect("/thanks");
// } else if (req.session.profileId) {
//     res.redirect("/petition");
// }

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
                req.session.userId = rows[0].id;
                res.redirect("/profile");
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
            // console.log("Data: ", data);

            compare(password, data[0].password).then(result => {
                console.log(result);
                if (result) {
                    req.session.userId = data[0].id;
                    if (data[0].user_id) {
                        req.session.profileId = data[0].user_id;
                    }
                    if (data[0].signature) {
                        req.session.signatureId = data[0].signature;
                    }

                    res.redirect("/");
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

// Log-Out Route //
app.get("/logout", (req, res) => {
    req.session.user_id = null;
    res.redirect("/login");
});

// Profile Page Routes //

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.post("/profile", (req, res) => {
    let age = req.body.age;
    let city = req.body.city;
    let homepage = req.body.homepage;
    let user_id = req.session.userId;
    console.log("profile info: ", age, city, homepage);
    console.log("user id should be: ", user_id);

    addProfile(age, city, homepage, user_id)
        .then(returnId => {
            req.session.profileId = returnId.rows[0].user_id;
            console.log("profileId: ", req.session.profileId);
        })
        .then(() => {
            res.redirect("/");
        })
        .catch(err => {
            console.log("Error in profile submission: ", err);
        });
});

// Petition Routes //
app.get("/petition", (req, res) => {
    console.log("GET request reaches petition");
    /////// COOKIES //////
    // req.session.peppermint = "Monkey Martin";
    // console.log("req.session: ", req.session.peppermint);
    //
    if (req.session.userId) {
        res.render("petition");
    } else {
        res.redirect("/register", {
            // csrfToken: req.csrfToken()
        });
    }
});

app.post("/petition", (req, res) => {
    // add values from user database created at the register page.
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

    addSigners(sig, timeStamp, consent, user_id)
        .then(returnId => {
            req.session.signatureId = returnId.rows[0].id;
            console.log("Id of new signature: ", req.session.signatureId); // returned id to access cookies
        })
        .then(() => {
            res.redirect("/thanks");
        })
        .catch(err => {
            if (err.code === "215") {
                console.log("non unique id ", err);
                res.redirect("/thanks");
            } else {
                console.log("Error in petition post: ", err);
                res.render("petition", {
                    err
                });
            }
        });
});

// Thank You Page Routes //
app.get("/thanks", (req, res) => {
    console.log("get request reaches thanks");
    //
    let id = req.session.userId;

    userSig(id)
        .then(result => {
            let sig = result[0].signature,
                first = result[0].first;
            console.log("result first name: ", first);
            getSigners().then(data => {
                let count = data.length;
                res.render("thanks", { sig, first, count });
            });
        })
        .catch(err => {
            "Error in displaying signature: ", err;
        });
});

// app.post("/thanks", (req, res) => {
//     res.redirect("/signers");
// });

// Signers Page Routes //
app.get("/signers", (req, res) => {
    getSigners()
        .then(data => {
            // console.log("signers data: ", data);
            res.render("signers", {
                data
            });
        })
        .catch(err => {
            console.log("error in Thanks post: ", err);
        });
});

app.get("/signers/:city", (req, res) => {
    getSignersByCity(req.params.city)
        .then(result => {
            res.render("signers", { result });
        })
        .catch(err => {
            console.log("error in signers by city: ", err);
        });
});

app.listen(process.env.PORT || 8080, () =>
    console.log("Petition server is listening")
);
