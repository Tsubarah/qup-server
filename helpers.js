let io = null
let sessions = null

// find sessionIndex
const findSessionIndex = (sessions, id) => {
  const sessionIndex = sessions.findIndex((session) => session.id === id)

  return sessionIndex
}

// find session
const findSession = (sessions, id) => {
  const session = sessions.find((session) => session.id === id)

  return session
}

// Add item to playlist
const handleAddItem = (data) => {
  const session = findSession(sessions, data.host)

  if (Object.keys(session.playingTrack).length === 0) {
    session.playingTrack = {
      id: data.videoId || data.items[0].id,
      artist: data.artist ? data.artist : null,
      title: data.title || data.items[0].snippet.title,
      uri: data.uri ? data.uri : null,
      image: data.image ? data.image : null,
      player: data.player,
      duration: data.duration,
    }
  } else {
    session.playlist.push({
      id: data.videoId || data.items[0].id,
      artist: data.artist ? data.artist : null,
      title: data.title || data.items[0].snippet.title,
      uri: data.uri ? data.uri : null,
      image: data.image ? data.image : null,
      player: data.player,
      duration: data.duration,
    })
  }
  io.to(session).emit("playlist", session.playlist)
  io.to(session).emit("playingTrack", session.playingTrack)
}

const handleEndedPlaying = (data) => {
  const session = findSession(sessions, data.host)

  session.playlist.splice(0, 1)

  session.playingTrack = {
    id: data.id,
    artist: data.artist || null,
    title: data.title,
    uri: data.uri || null,
    image: data.image || null,
    player: data.player,
    duration: data.duration,
  }

  io.to(session).emit("playlist", session.playlist)
  io.to(session).emit("playingTrack", session.playingTrack)
}

module.exports = {
  findSessionIndex,
  findSession,
  handleAddItem,
  handleEndedPlaying,
  function(socket, _io, _sessions) {
    io = _io
    sessions = _sessions
  },
}
