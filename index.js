const express = require("express");
const app = express();
const hb = require("express-handlebars");
const signatures = require("./signatures");
// const cp = require('cookie-parser');
const cookieSession = require("cookie-session");

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
        secret: "hootie",
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);
app.get("/", (req, res) => {
    console.log("You went to the slash route");
    //
    req.session.peppermint = "Rhino Randy";
    console.log("req.session for the slash route: ", req.session.peppermint);
    //
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    console.log("GET request reaches petition");
    //
    /////// COOKIES //////
    req.session.peppermint = "Monkey Martin";
    console.log("req.session: ", req.session.peppermint);
    //
    res.render("petition", {
        layout: "main",
        helpers: {}
    });
});

app.post("/petition", (req, res) => {
    let firstName = req.body.first;
    let lastName = req.body.last;
    let sig = req.body.sig;
    // let canvasData = req.body;

    signatures
        .addSigners(firstName, lastName, sig)
        .then(returnId => {
            res.redirect("/thanks");
            console.log("Id of new signature: ", returnId.rows[0].id); // returned id to access cookies
        })
        .catch(err => {
            console.log("Error in post: ", err);
            res.render("petition", {
                err
            });
        });
});

app.get("/thanks", (req, res) => {
    res.render("thanks");
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

app.listen(8080, () => console.log("Petition server is listening"));
