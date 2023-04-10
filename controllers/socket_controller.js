/**
 * Socket Controller
 */
const debug = require("debug")("q-up:socket_controller")
const { findSessionIndex, findSession } = require("../helpers")
const { nanoid } = require("nanoid")

let io = null
let sessions = null

const reconnect = function ({ sessionId, userId }) {
  const session = sessions.find((session) => session.sessionId === sessionId)
  console.log(session, sessionId, userId)

  if (session) {
    const isHost = session.sessionId == sessionId
    this.join(session)

    if (isHost) {
      io.to(this.id).emit("host:joined", {
        userId: session.id,
        sessionId: sessionId,
        method: "reconnect/host",
      })
    } else {
      io.to(session).emit("user:joined", {
        userId: session.id,
        method: "reconnect/user",
      })
    }
  }
}

const createSession = function () {
  console.log("Host joined with id:", this.id)
  const sessionId = nanoid()
  let session = {
    id: this.id,
    sessionId: sessionId,
    playingTrack: {},
    playlist: [],
    users: [],
    accessToken: "",
  }

  if (sessions.find((session) => session.id === this.id)) {
    return
  } else {
    // console.log("ConnectSession", session)
    sessions.push(session)
    this.join(session)
  }
  io.to(session).emit("host:joined", {
    userId: this.id,
    sessionId: session.sessionId,
  })
}

const handleUserConnect = function (id) {
  console.log("User joined with id:", this.id)

  const session = sessions.find((session) => session.id === id)
  // console.log("session", session)
  if (session) {
    session.users.push(this.id)
    this.join(session)
    io.to(session).emit("user:joined", {
      id,
      token: session.accessToken,
    })
  }
}

// Disconnect session if host leaves
const handleDisconnect = function () {
  // const session = findSession(sessions, this.id)
  // console.log("sessionDisconnect", session)
  // if (session) {
  //   sessions.splice(findSessionIndex(sessions, session), 1)
  // }
}

const handleSessionToken = function (sessionToken) {
  const session = findSession(sessions, this.id)
  session.accessToken = sessionToken
}

// const resetPlayingTrack = ({ host }) => {
//   console.log("host", host)
//   const session = findSession(sessions, host)
//   console.log("session.playingTrack", session.playingTrack)
//   session.playingTrack = []
// }

// Player Controls

const handlePlayPause = ({ host, playing }) => {
  const session = findSession(sessions, host)
  io.to(session).emit("media:playPause", playing)
}

const handleNext = ({ host }) => {
  const session = findSession(sessions, host)
  session.playingTrack = session.playlist[0]

  session.playlist.splice(0, 1)

  io.to(session).emit("playlist", session.playlist)
  io.to(session).emit("playingTrack", session.playingTrack)
}

/**
 * Export controller and attach handlers to events
 */
module.exports = function (socket, _io, _sessions) {
  io = _io

  sessions = _sessions

  // handle host connect
  socket.on("host:joined", createSession)

  socket.on("user:joined", handleUserConnect)

  socket.on("reconnect", reconnect)

  // handle host disconnect
  socket.on("disconnect", handleDisconnect)

  socket.on("sessionToken", handleSessionToken)

  socket.on("media:playPause", handlePlayPause)

  // socket.on("media:reset", resetPlayingTrack)

  socket.on("media:next", handleNext)
}
