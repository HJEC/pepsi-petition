const bcrypt = require("bcryptjs");
//salt - hash - compare
let { genSalt, hash, compare } = bcrypt;
const { promisify } = require("util");

genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

module.exports.compare = compare; // compare login password to the hash. If true, then password matched

module.exports.hashPass = plainTextPass =>
    genSalt().then(salt => hash(plainTextPass, salt));
