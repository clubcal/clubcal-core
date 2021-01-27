import * as express from "express"

import { makePool } from "./pg_conn"

const app = express()
const PORT = 8080

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

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`)
})
