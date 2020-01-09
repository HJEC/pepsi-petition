const express = require("express");
const app = express();
const hb = require("express-handlebars");
const signatures = require("./signatures");

app.engine("handlebars", hb());
app.set("view engine", "handlebars");

app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false
    })
);

app.get("/petition", (req, res) => {
    console.log("GET request reaches petition");
    res.render("petition", {
        layout: "main",
        helpers: {}
    });
});

app.post("/petition", (req, res) => {
    let firstName = req.body.first;
    let lastName = req.body.last;
    // let canvasData = req.body;
    let sig = req.body.sig;

    signatures
        .addSigners(firstName, lastName, sig)
        .then(function() {
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
    res.render("thanks");
});

app.post("/thanks", (req, res) => {
    signatures.getSigners;
});

app.listen(8080, () => console.log("Petition server is listening"));
