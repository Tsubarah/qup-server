const axios = require("axios")
const { findSession, handleAddItem, handleEndedPlaying } = require("../helpers")
const duration = require("duration-fns")

let io = null
let sessions = null

const getYoutubeData = ({ searchInput, socketId }) => {
  const options = {
    method: "GET",
    url: "https://youtube-v31.p.rapidapi.com/search",
    params: {
      q: searchInput,
      part: "snippet,id",
      regionCode: "US",
      maxResults: "10",
      order: "viewCount",
    },
    headers: {
      "X-RapidAPI-Key": "1552b2e656msh3fd517b05c24027p199e32jsn861374fb94c3",
      "X-RapidAPI-Host": "youtube-v31.p.rapidapi.com",
      "access-control-allow-origin": "*",
    },
  }

  axios
    .request(options)
    .then(function (response) {
      io.to(socketId).emit("searchResult", JSON.stringify(response.data))
    })
    .catch(function (error) {
      console.error(error)
    })
}

const getYoutubeVideo = ({ videoId, host }) => {
  const options = {
    method: "GET",
    url: "https://youtube-v31.p.rapidapi.com/videos",
    params: { part: "contentDetails,snippet,statistics", id: videoId },
    headers: {
      "X-RapidAPI-Key": "1552b2e656msh3fd517b05c24027p199e32jsn861374fb94c3",
      "X-RapidAPI-Host": "youtube-v31.p.rapidapi.com",
      "access-control-allow-origin": "*",
    },
  }

  axios
    .request(options)
    .then(function (response) {
      // const session = findSession(sessions, host)
      const videoDurationISO = response.data.items.map(
        (item) => item.contentDetails.duration
      )
      // converting object of string to string
      const videoDurationString = videoDurationISO.join("").toString()
      // converting ISO string to milliseconds
      const videoDuration = duration.toMilliseconds(videoDurationString)

      const data = response.data
      data.host = host
      data.player = "youtube"
      data.duration = videoDuration
      handleAddItem(data)
    })
    .catch(function (error) {
      console.error(error)
    })
}

const handleRemoveItem = ({ host, index }) => {
  const session = findSession(sessions, host)
  session.playlist.splice(index, 1)
  io.to(session).emit("playlist", session.playlist)
}

module.exports = function (socket, _io, _sessions) {
  io = _io
  sessions = _sessions
  socket.on("search", getYoutubeData)

  socket.on("youtubeId", getYoutubeVideo)

  socket.on("playlist-item:remove", handleRemoveItem)

  socket.on("youtube:ended", handleEndedPlaying)
}
