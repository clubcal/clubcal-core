import * as dotenv from "dotenv"
import * as express from "express"

import { makePool } from "./pg_conn"

dotenv.config()

const app = express()
const HOST = "0.0.0.0"
const PORT = parseInt(process.env.PORT || "8000", 10)

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

app.get("/events/summary/", async (req, res) => {
  try {
    const countResult = await pool.query("SELECT count(*) FROM ch_events")
    const latestEventResult = await pool.query(
      "SELECT created_on FROM ch_events ORDER BY created_on DESC LIMIT 1"
    )
    res
      .status(200)
      .json({ total: countResult.rows[0].count, lastUpdate: latestEventResult.rows[0].created_on })
  } catch (error) {
    res.status(500).json({ error })
  }
})

app.listen(PORT, HOST, () => {
  console.log(`⚡️[server]: Server is running at ${HOST}:${PORT}`)
})
