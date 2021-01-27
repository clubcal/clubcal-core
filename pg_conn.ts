import * as dotenv from "dotenv"
dotenv.config()

const Pool = require("pg").Pool

export function makePool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  return pool
}
