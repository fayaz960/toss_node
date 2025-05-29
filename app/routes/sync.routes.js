const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const sync_controller = require("../controllers/sync/sync.controller");

module.exports = function (app) {
  app.post("/api/sync",  sync_controller.syncAttendance) 
  app.post("/api/sync_all",  sync_controller.syncAllatOnce) 
};
