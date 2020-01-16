const spicedPg = require("spiced-pg"),
    db = spicedPg(
        process.env.DATABASE_URL ||
            "postgres:postgres:postgres@localhost:5432/petition"
    );
const { hashPass } = require("./bcrypt");

exports.registerUser = function(first, last, email, password) {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, email, password]
    );
};

exports.logInUser = function(email) {
    return db
        .query(
            `SELECT email, password, users.id, signatures.consent, profiles.user_id FROM users LEFT JOIN signatures ON users.id = signatures.user_id LEFT JOIN profiles ON users.id = profiles.user_id WHERE email = '${email}'`
        )
        .then(({ rows }) => rows);
};

exports.addProfile = function(age, city, homepage, user_id) {
    return db.query(
        `INSERT INTO profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) RETURNING user_id`,
        [age, city, homepage, user_id]
    );
};

exports.getProfileData = function(id) {
    return db
        .query(
            `SELECT first, last, age, city, email, password, signature, url FROM users JOIN profiles ON users.id = profiles.user_id LEFT JOIN signatures ON users.id = signatures.user_id WHERE profiles.user_id = $1`,
            [id]
        )
        .then(({ rows }) => rows);
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

exports.deleteSig = function(id) {
    return db.query(`DELETE FROM signatures WHERE user_id = $1`, [id]);
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

exports.updateUser = function(first, last, email, id) {
    return db.query(
        `UPDATE users SET first = $1, last = $2, email = $3 WHERE id = $4`,
        [first, last, email, id]
    );
};

exports.updateUserPassword = function(password, id) {
    if (password) {
        hashPass(password).then(hashedPass => {
            return db.query(`UPDATE users SET password = $1 WHERE id = $2`, [
                hashedPass,
                id
            ]);
        });
    }
};

exports.upsertProfile = function(age, city, url, id) {
    return db.query(
        `INSERT INTO profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET age = $1, city = $2, url = $3`,
        [age, city, url, id]
    );
};
