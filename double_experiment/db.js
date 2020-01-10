const spicedPg = require("spiced-pg"),
    db = spicedPg("postgres:postgres:postgres@localhost:5432/cities");

exports.getCities = function() {
    return db.query("SELECT id, population FROM cities").then(({ rows }) => {
        console.log("here is the result: ", rows);
    });
};

// BUILDING THE STRINGS WITH INPUT FROM OUTSIDE USERS IS DANGEROUS!
// If you plug a value into a query, which will be run in postgres, using interpolation
// will allow a malicious user to write "DROP TABLE <example table>" instead of the
// expected values for city, country or population.
// dont let those bastards trick you!
exports.addCity = function(city, country, population) {
    return db.query(
        `INSERT INTO cities (city, country, population) VALUES ($1, $2, $3)`,
        [city, country, population]
    );
};
