const express = require("express");
const app = express();
const hb = require("express-handlebars");
const signatures = require("./signatures");
// const cp = require('cookie-parser');
const cookieSession = require("cookie-session");
const { SESSION_SECRET: sessionSecret } = require("./secrets.json");
const csurf = require("csurf");

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
    console.log("req.session.id for /: ", req.session.signatureId);
    //
    res.redirect("/petition");
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
    let timeStamp = new Date();
    // let canvasData = req.body;

    signatures
        .addSigners(firstName, lastName, sig, timeStamp)
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
    signatures
        .userSig(id)
        .then(result => {
            let sig = result[0].signature;
            console.log("signature result: ", sig);
            res.render("thanks", { sig });
        })
        .catch(err => {
            "Error in displaying signature: ", err;
        });
});

app.post("/thanks", (req, res) => {
    // let showSigs = true;
    signatures
        .getSigners()
        .then(data => {
            console.log("List should render");
            res.render("thanks", {
                // showSigs,
                data
            });
        })
        .catch(err => {
            console.log("error in Thanks post: ", err);
        });
});

// app.get("/signers", (req, res) => {
//     console.log("GET request reaches signed");
//
//     let id = req.session.signatureId;
//     signatures.userSig(id).then(result => {
//         signatures
//             .getSigners()
//             .then(data => {
//                 let sig = result[0].signature;
//                 res.render("signers", { sig, data });
//             })
//             .catch(err => {
//                 "Error in displaying signature: ", err;
//             });
//     });
// });

app.listen(8080, () => console.log("Petition server is listening"));
