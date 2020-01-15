const spicedPg = require("spiced-pg"),
    db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

exports.registerUser = function(first, last, email, password) {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, email, password]
    );
};

exports.logInUser = function(email) {
    return db
        .query(
            `SELECT email, password, users.id, signatures.signature, profiles.user_id FROM users LEFT JOIN signatures ON users.id = signatures.user_id LEFT JOIN profiles ON users.id = profiles.user_id WHERE email = '${email}'`
        )
        .then(({ rows }) => rows);
};

exports.addProfile = function(age, city, homepage, user_id) {
    return db.query(
        `INSERT INTO profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) RETURNING user_id`,
        [age, city, homepage, user_id]
    );
};

// BUILDING THE STRINGS WITH INPUT FROM OUTSIDE USERS IS DANGEROUS!
// If you plug a value into a query, which will be run in postgres, using interpolation
// will allow a malicious user to write "DROP TABLE <example table>" instead of the
// expected values for city, country or population.
// dont let those bastards trick you!
exports.addSigners = function(signature, timeStamp, consent, user_id) {
    return db.query(
        `INSERT INTO signatures (signature, t_stamp, consent, user_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [signature, timeStamp, consent, user_id]
    );
};

exports.userSig = function(id) {
    return db
        .query(
            `SELECT users.first, signatures.signature FROM users JOIN signatures ON signatures.user_id = users.id WHERE users.id = $1`,
            [id]
        )
        .then(({ rows }) => rows)
        .catch(err => {
            console.log("error in userSig:", err);
        });
};

exports.getSigners = function() {
    return db
        .query(
            "SELECT users.first, users.last, signatures.signature, profiles.age, profiles.city, profiles.url FROM users JOIN signatures ON signatures.user_id = users.id JOIN profiles ON profiles.user_id = users.id WHERE signatures.consent = 'clicked'"
        )
        .then(({ rows }) => rows);
};

exports.getSignersByCity = function(city) {
    return db
        .query(
            `SELECT users.first, users.last, signatures.signature, profiles.age, profiles.city, profiles.url FROM users JOIN signatures ON signatures.user_id = users.id JOIN profiles ON profiles.user_id = users.id WHERE LOWER (profiles.city) = LOWER('${city}')`
        )
        .then(({ rows }) => rows);
};
