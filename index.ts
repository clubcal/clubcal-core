import * as dotenv from "dotenv"
import * as express from "express"

import { makePool } from "./pg_conn"

dotenv.config()

const app = express()
const HOST = process.env.API_SERVER_HOST || "0.0.0.0"
const PORT = parseInt(process.env.API_SERVER_PORT || "8000", 10)

const pool = makePool()

app.get("/", (_, res) => res.send("Welcome to clubcal!"))

app.get("/events/", async (req, res) => {
  const limit = req.query.limit
  try {
    const result = await pool.query(
      `SELECT * FROM ch_events ORDER BY "ID" DESC ${limit ? "LIMIT $1" : ""}`,
      limit ? [limit] : []
    )
    res.status(200).json(result.rows)
  } catch (error) {
    res.status(500).json({ error })
  }
})

app.listen(PORT, HOST, () => {
  console.log(`⚡️[server]: Server is running at ${HOST}:${PORT}`)
})
