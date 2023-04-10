require("dotenv").config()

const debug = require("debug")("q-up:server")
const http = require("http")
const socketio = require("socket.io")
const { instrument } = require("@socket.io/admin-ui")
const socket_controller = require("./controllers/socket_controller")
const youtube_controller = require("./controllers/youtube_controller")
const spotify_controller = require("./controllers/spotify_controller")
const helpers = require("./helpers")
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const spotify = require("./routes/spotify")

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/spotify", spotify)

/**
 * Get port from environment
 */
const port = process.env.PORT || "3000"

/**
 * Create HTTP and Socket.IO server
 */
const server = http.createServer(app)
const io = new socketio.Server(server, {
  cors: {
    origin: "*",
  },
  transports: ["websocket", "polling"],
})

// use the spotify.js file to handle spotify endpoints

app.get("/", (req, res) => {
  //handle root
})
/**
 * Set up Socket.IO Admin
 */
instrument(io, {
  auth: false,
})

let sessions = []

/**
 * Handle incoming connections
 */
io.on("connection", (socket) => {
  socket_controller(socket, io, sessions),
    youtube_controller(socket, io, sessions),
    spotify_controller.function(socket, io, sessions),
    helpers.function(socket, io, sessions)
})

/**
 * Listen on provided port, on all network interfaces
 */
server.listen(port)
server.on("error", onError)
server.on("listening", onListening)

/**
 * Event listener for HTTP server "error" event
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error
  }

  // handle specific listen error with friendly messages
  switch (error.code) {
    case "EADDRINUSE":
      console.error(`Port ${port} is already in use`)
      process.exit(1)
      break
    default:
      throw error
  }
}

/**
 * Event listener for HTTP server "listening" event
 */
function onListening() {
  const addr = server.address()
  console.log(`Listening on port ${addr.port}`)
}
