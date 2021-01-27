import * as dotenv from "dotenv"
dotenv.config()

const Pool = require("pg").Pool

export function makePool() {
  const pool = new Pool({
    user: process.env.PG_DB_USER,
    host: process.env.PG_DB_HOST,
    database: process.env.PG_DB_NAME,
    password: process.env.PG_DB_PASSWORD,
    port: process.env.PG_DB_PORT,
    ssl: { rejectUnauthorized: false }
  })
  return pool
}
