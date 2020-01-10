const db = require("./db");

// db.getCities().thenA(data => console.log("data: ", data));

db.addCity("paris", "Pennsylvania, USA", 732)
    .then(function() {
        return db.getCities();
    })
    .then(data => console.log("new city: ", data));
