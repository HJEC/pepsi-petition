DROP TABLE IF EXISTS profiles;

CREATE TABLE profiles(
    id SERIAL PRIMARY KEY,
    age INT,
    city VARCHAR,
    url VARCHAR,
    user_id INT REFERENCES users(id) NOT NULL UNIQUE --foreign key (requiring column from a different table)
);
