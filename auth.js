const express = require("express"),
    router = express.Router(),
    { compare, hashPass } = require("./bcrypt.js");
const {
    registerUser,
    logInUser,
    capitalizeFirstLetter
} = require("./extFunctions");

const { requireLoggedOutUser } = require("./middleware");
let secrets;
if (process.env.NODE_ENV === "production") {
    secrets = process.env;
} else {
    secrets = require("./secrets.json");
}
// SLASH Route //
router.get("/", (req, res) => {
    res.redirect("/register");
});

// Register Page Routes //
router.get("/register", requireLoggedOutUser, (req, res) => {
    res.locals.register = true;
    delete res.locals.login;
    res.render("register");
});

router.post("/register", requireLoggedOutUser, (req, res) => {
    let password = req.body.password;
    delete res.locals.register;
    hashPass(password).then(hashedPass => {
        let first = capitalizeFirstLetter(req.body.first.toLowerCase());
        let last = capitalizeFirstLetter(req.body.last.toLowerCase());
        let email = req.body.email.toLowerCase();

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
                    res.render("register", { err, register: true });
                }
            });
    });
});

// Log-In routes //
router.get("/login", requireLoggedOutUser, (req, res) => {
    delete res.locals.register;
    res.locals.login = true;
    res.render("login");
});

router.post("/login", requireLoggedOutUser, (req, res) => {
    let email = req.body.email,
        password = req.body.password;
    // delete res.locals.login;

    logInUser(email)
        .then(data => {
            compare(password, data[0].password).then(result => {
                if (result) {
                    req.session.userId = data[0].id;
                    if (data[0].user_id) {
                        req.session.profileId = data[0].id;
                    }
                    if (data[0].consent) {
                        req.session.signatureId = data[0].id;
                    }
                    res.redirect("/profile");
                } else {
                    res.render("login", { passWrong: true, login: true });
                }
            });
        })
        .catch(err => {
            console.log("Error in email: ", err);
            res.render("login", { emailWrong: true, login: true });
        });
});

// Log-Out Route //
router.get("/logout", (req, res) => {
    delete req.session.userId;
    delete req.session.profileId;
    delete req.session.signatureId;
    delete res.locals.register;
    delete res.locals.login;
    delete res.locals.showProfile;
    delete res.locals.showSig;
    res.redirect("/login");
});

module.exports = router;
