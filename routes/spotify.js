const express = require("express")
let router = express.Router()
const spotify_controller = require("../controllers/spotify_controller")

router.get("/refresh", spotify_controller.getRefreshAccessToken)
router.get("/login", spotify_controller.getAccessToken)
router.get("/callback", spotify_controller.callback)
router.get("/lyrics", spotify_controller.getLyrics)

module.exports = router
