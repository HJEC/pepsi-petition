DROP TABLE IF EXISTS signatures;

CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    signature VARCHAR NOT NULL CHECK (signature != ''),
    t_stamp VARCHAR NOT NULL CHECK (t_Stamp != ''),
    consent VARCHAR,
    user_id INT NOT NULL UNIQUE REFERENCES users(id) --foreign key (requiring column from a different table)
);
