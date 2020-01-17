const express = require("express"),
  router = express.Router(),
  { compare, hashPass } = require("./bcrypt.js");
const {
  registerUser,
  logInUser,
  capitalizeFirstLetter,
  getSigners
} = require("./extFunctions");

const { requireLoggedOutUser } = require("./middleware");

// SLASH Route //
router.get("/", (req, res) => {
  res.redirect("/register");
});

// Register Page Routes //
router.get("/register", requireLoggedOutUser, (req, res) => {
  res.render("register");
});

router.post("/register", requireLoggedOutUser, (req, res) => {
  let password = req.body.password;

  hashPass(password).then(hashedPass => {
    let first = capitalizeFirstLetter(req.body.first.toLowerCase());
    let last = capitalizeFirstLetter(req.body.last.toLowerCase());
    let email = req.body.email.toLowerCase();
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
router.get("/login", requireLoggedOutUser, (req, res) => {
  res.render("login");
});

router.post("/login", requireLoggedOutUser, (req, res) => {
  let email = req.body.email,
    password = req.body.password;

  logInUser(email)
    .then(data => {
      compare(password, data[0].password).then(result => {
        console.log(result);
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
router.get("/logout", (req, res) => {
  delete req.session.userId;
  delete req.session.profileId;
  delete req.session.signatureId;
  res.redirect("/login");
});

module.exports = router;