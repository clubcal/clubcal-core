import * as dotenv from "dotenv"

import * as Twitter from "twitter"
import * as matchAll from "match-all"
import * as fetch from "node-fetch"
import * as moment from "moment-timezone"

import { makePool } from "./pg_conn"

dotenv.config()
const TW_CONSUMER_KEY = process.env.TW_CONSUMER_KEY || "XXXXXXXXXXXXXXXXX"
const TW_CONSUMER_SEC = process.env.TW_CONSUMER_SEC || "XXXXXXXXXXXXXXXXX"
const TW_ACCESS_TOKEN_KEY = process.env.TW_ACCESS_TOKEN_KEY || "XXXXXXXXXXXXXXXXX"
const TW_ACCESS_TOKEN_SEC = process.env.TW_ACCESS_TOKEN_SEC || "XXXXXXXXXXXXXXXXX"

const client = new Twitter({
  consumer_key: TW_CONSUMER_KEY,
  consumer_secret: TW_CONSUMER_SEC,
  access_token_key: TW_ACCESS_TOKEN_KEY,
  access_token_secret: TW_ACCESS_TOKEN_SEC
})

const zoneInfo = moment.tz.names().map((z) => {
  let zone = moment.tz(z)
  return {
    abbr: zone.zoneAbbr(),
    name: z
  }
})

async function main() {
  const pool = makePool()

  client.stream(
    "statuses/filter",
    {
      track: "joinclubhouse"
      //locations: '18.3074488,-34.3583284,19.0046700,-33.4712700'
    },
    function (stream) {
      stream.on("data", async function (tweet) {
        for (const url of tweet.entities.urls) {
          const expanded_url: String = url.expanded_url
          const match = expanded_url.match(
            /^(http|https):\/\/[www.]*joinclubhouse.com\/event\/(.*)$/
          )
          if (match === null) {
            continue
          }

          fetchContent(match[0], async ({ nameRoom, withRoom, descRoom, dateRoom, linkRoom }) => {
            try {
              const result = await pool.query(
                "INSERT INTO ch_events (name, description, moderators, scheduled_for, link) VALUES ($1, $2, $3, $4, $5) RETURNING *",
                [nameRoom, descRoom, withRoom, dateRoom, linkRoom]
              )
              console.log(`Event ${linkRoom} added with ID: ${result.rows[0].ID}`)
            } catch (error) {
              console.error(error)
            }
          })
        }
      })
      stream.on("error", function (error) {
        console.log(error)
      })
    }
  )

  runRoomCleaner(pool)
}

const parseRoomInfo = (body) => {
  const rexp = /content="(.*?)"/gi

  const new_data = matchAll(body, rexp).toArray()

  const nameRoom = new_data[3]
  const fullDescRoom = new_data[4]
  const linkRoom = new_data[8]

  const step_1 = fullDescRoom.match("(.*?).with")
  const step_2 = step_1[1].replace(",", "")
  const dateStr = step_2.replace("at ", "")
  const tzAbbr = dateStr.split(" ").pop().toUpperCase()
  const dateRoom = moment
    .tz(dateStr, "dddd MMMM DD HH:mmA ?", zoneInfo.filter((z) => z.abbr === tzAbbr)[0].name)
    .format()
  const withRoom = fullDescRoom.substring(
    fullDescRoom.indexOf("with") + 5,
    fullDescRoom.indexOf(".")
  )
  const descRoom = fullDescRoom.substring(fullDescRoom.indexOf(".") + 2)

  return {
    nameRoom,
    withRoom,
    descRoom,
    dateRoom,
    linkRoom
  }
}

const fetchContent = (url, onComplete) => {
  fetch(url, { static: true })
    .then((response) => response.text())
    .then((text) => onComplete(parseRoomInfo(text)))
}

const runRoomCleaner = async (pool) => {
  try {
    await pool.query("DELETE FROM ch_events where scheduled_for < NOW() - interval '5 days'")
  } catch (error) {
    console.error(error)
  }
  // Continue running the room cleaner periodically (e.g. once every hour)
  setTimeout(() => runRoomCleaner(pool), 1000 * 60 * 60)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
