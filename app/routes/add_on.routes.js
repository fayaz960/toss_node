const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const addon_controller = require("../controllers/add_ons/add_on.controller");

module.exports = function (app) {
  app.post("/api/add_add_on", [authJwt.verifyToken], addon_controller.addSubscription)
  app.post("/api/get_add_on", [authJwt.verifyToken], addon_controller.getAddOns)
  app.post("/api/update_add_on", [authJwt.verifyToken], addon_controller.updateAddons)
};
