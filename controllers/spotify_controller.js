const SpotifyWebApi = require("spotify-web-api-node")
const { findSession, handleAddItem, handleEndedPlaying } = require("../helpers")
const lyricsFinder = require("lyrics-finder")
const querystring = require("querystring")
const axios = require("axios")

let io = null
let sessions = null

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI
const CLIENT_URL = process.env.CLIENT_URL
const SPOTIFY_URL = process.env.SPOTIFY_URL

const getRefreshAccessToken = (req, res) => {
  const { refresh_token } = req.query

  axios({
    method: "post",
    url: `${SPOTIFY_URL}/api/token`,
    data: querystring.stringify({
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString("base64")}`,
    },
  })
    .then((response) => {
      res.send(response.data)
    })
    .catch((error) => {
      res.send(error)
    })
}

const generateRandomString = (length) => {
  let text = ""
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

const stateKey = "spotify_auth_state"

const getAccessToken = (req, res) => {
  const state = generateRandomString(16)
  res.cookie(stateKey, state)

  const scopes = [
    "user-read-email",
    "playlist-read-private",
    "playlist-read-collaborative",
    "streaming",
    "user-read-private",
    "user-library-read",
    "user-library-modify",
    "user-top-read",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-recently-played",
  ].join(",")

  const params = {
    scope: scopes,
  }

  const queryParams = querystring.stringify({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: `${REDIRECT_URI}/spotify/callback`,
    state: state,
    scope: params.scope,
  })

  res.redirect(`${SPOTIFY_URL}/authorize?${queryParams}`)
}

const callback = (req, res) => {
  const code = req.query.code || null

  axios({
    method: "post",
    url: `${SPOTIFY_URL}/api/token`,
    data: querystring.stringify({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: `${REDIRECT_URI}/spotify/callback`,
    }),
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer.from(
        `${CLIENT_ID}:${CLIENT_SECRET}`
      ).toString("base64")}`,
    },
  })
    .then((response) => {
      if (response.status === 200) {
        const { access_token, refresh_token, expires_in } = response.data

        const queryParams = querystring.stringify({
          access_token,
          refresh_token,
          expires_in,
        })

        res.redirect(`${CLIENT_URL}/?${queryParams}`)
      } else {
        res.redirect(`/?${querystring.stringify({ error: "invalid_token" })}`)
      }
    })
    .catch((error) => {
      res.send(error)
    })
}

const search = (req, res) => {
  const session = findSession(sessions, req.host)

  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  })
  spotifyApi.setAccessToken(session.accessToken)
  spotifyApi.searchTracks(req.searchInput).then((res) => {
    let data = []
    res.body.tracks.items.map((track) => {
      data.push(track)
      const mediumImage =
        track.album.images[Math.floor(track.album.images.length / 2)]
    })
    io.to(req.socketId).emit("spotifySearch", data)
    data = []
  })
}

const getLyrics = async (req, res) => {
  const lyrics =
    (await lyricsFinder(req.query.artist, req.query.track)) || "No Lyrics Found"
  res.json({ lyrics })
}

module.exports = {
  getAccessToken,
  getRefreshAccessToken,
  callback,
  getLyrics,
  function(socket, _io, _sessions) {
    io = _io
    sessions = _sessions

    socket.on("spotifySearch", search)

    socket.on("spotifyId", handleAddItem)

    socket.on("spotify:ended", handleEndedPlaying)
  },
}
