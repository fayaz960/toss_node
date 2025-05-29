const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const controller = require("../controllers/attendance/attendance.controller");

module.exports = function (app) {
  app.post("/api/attendance/count", [authJwt.verifyToken], controller.attendanceDashBoardcount);
  app.post("/api/subscribed_students", [authJwt.verifyToken], controller.getStudentforPlans);
  app.post("/api/active/inactive/students", [authJwt.verifyToken], controller.getActiveMembers);
};