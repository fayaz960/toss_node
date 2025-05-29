const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const fee_management_controller = require("../controllers/fee management/fee_management.controller");

module.exports = function (app) {
  app.get("/api/save_fee_management", fee_management_controller.saveFeeDetailsOfStudents);
  app.post("/api/get_fee_management", [authJwt.verifyToken], fee_management_controller.getStudentFeemanagement);
  app.post("/api/update_fee_management", [authJwt.verifyToken], fee_management_controller.updateFeeManagementOfStduent);
  app.post("/api/sent_alert", [authJwt.verifyToken], fee_management_controller.handleSendAlert);
  app.post("/api/sent_alert_all", [authJwt.verifyToken], fee_management_controller.handleSendAlertToAll);
};
