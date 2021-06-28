const db = require("./db");


db.addCity("paris", "Pennsylvania, USA", 732)
    .then(function() {
        return db.getCities();
    })
    .then(data => console.log("new city: ", data));
