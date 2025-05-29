const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const dashboard_controller = require("../controllers/dashboard/dashboard.controller");

module.exports = function (app) {
  app.get("/api/get_dashboard_count", [authJwt.verifyToken], dashboard_controller.dashboardCountData);
  app.get("/api/get_montly_fee_report", [authJwt.verifyToken], dashboard_controller.getmonthlyFeeDataAndOverDue);
  app.post("/api/subscription/chart", [authJwt.verifyToken], dashboard_controller.subscriptionPieChartData);
};
