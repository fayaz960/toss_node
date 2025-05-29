const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const subscription_controller = require("../controllers/subscription/subscription.controller");

module.exports = function (app) {
  app.post("/api/add_subscription", [authJwt.verifyToken], subscription_controller.addSubscription);
  app.post("/api/get_subscription", [authJwt.verifyToken], subscription_controller.getSubscriptions);
  app.post("/api/update_subscription", [authJwt.verifyToken], subscription_controller.updateSubscription);
  app.post("/api/subscribed_count", [authJwt.verifyToken], subscription_controller.getPlanAndStudentCount);
};
