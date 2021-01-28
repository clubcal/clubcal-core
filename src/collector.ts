import * as dotenv from "dotenv"

import * as Twitter from "twitter"
import * as matchAll from "match-all"
import * as fetch from "node-fetch"

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
}

const parseRoomInfo = (body) => {
  const rexp = /content="(.*?)"/gi

  const new_data = matchAll(body, rexp).toArray()

  const nameRoom = new_data[3]
  const fullDescRoom = new_data[4]
  const linkRoom = new_data[7]

  const step_1 = fullDescRoom.match("(.*?).with")
  const step_2 = step_1[1].replace(",", "")
  const dateRoom = step_2.replace("at ", "").replace("am", " am").replace("pm", " pm")
  const withRoom = fullDescRoom.substring(
    fullDescRoom.indexOf("with") + 5,
    fullDescRoom.indexOf(".")
  )
  const descRoom = fullDescRoom.substring(fullDescRoom.indexOf(".") + 2)

  return {
    nameRoom,
    withRoom,
    descRoom,
    dateRoom: new Date(Date.parse(dateRoom)),
    linkRoom
  }
}

const fetchContent = (url, onComplete) => {
  fetch(url, { static: true })
    .then((response) => response.text())
    .then((text) => onComplete(parseRoomInfo(text)))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})