const spicedPg = require("spiced-pg"),
    db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

exports.userSig = function(id) {
    return db
        .query(`SELECT first, signature FROM signatures WHERE id = $1`, [id])
        .then(({ rows }) => rows);
};

exports.getSigners = function() {
    return db
        .query(
            "SELECT first, last, signature, t_stamp FROM signatures WHERE consent = 'clicked'"
        )
        .then(({ rows }) => rows);
};

// BUILDING THE STRINGS WITH INPUT FROM OUTSIDE USERS IS DANGEROUS!
// If you plug a value into a query, which will be run in postgres, using interpolation
// will allow a malicious user to write "DROP TABLE <example table>" instead of the
// expected values for city, country or population.
// dont let those bastards trick you!
exports.addSigners = function(
    first,
    last,
    signatures,
    timeStamp,
    consent,
    user_id
) {
    return db.query(
        `INSERT INTO signatures (first, last, signature, t_stamp, consent, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [first, last, signatures, timeStamp, consent, user_id]
    );
};

exports.logInUser = function(email) {
    return db
        .query(`SELECT * FROM users WHERE email = '${email}'`)
        .then(({ rows }) => rows);
};

exports.registerUser = function(first, last, email, password) {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, email, password]
    );
};
