require('dotenv').config()

const {Pool} = require('pg');

const databaseUrl = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: databaseUrl,
});

module.exports = pool;