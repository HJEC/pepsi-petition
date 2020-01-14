DROP TABLE IF EXISTS profiles;

CREATE TABLE profiles(
    id SERIAL PRIMARY KEY,
    age INT,
    city VARCHAR,
    url VARCHAR,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) --foreign key (requiring column from a different table)
);
