const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const report_controller = require("../controllers/report/report.controller");

module.exports = function (app) {
  app.get("/api/get_report_count", [authJwt.verifyToken], report_controller.getReportCountData);
  app.post("/api/payment_report", [authJwt.verifyToken], report_controller.paymentReportFunction);
  app.post("/api/arrear_report", [authJwt.verifyToken], report_controller.arrearReportFunction);
  app.post("/api/student_report", [authJwt.verifyToken], report_controller.studentReportFunction);

  //export to excel routes
  app.post("/api/payment_report/export", [authJwt.verifyToken], report_controller.paymentReportexporttoExcelFunction);
  app.post("/api/arrear_report/export", [authJwt.verifyToken], report_controller.arrearReportexporttoExcelFunction);
  app.post("/api/student_report/export", [authJwt.verifyToken], report_controller.studentReportexporttoExcelFunction);
};
