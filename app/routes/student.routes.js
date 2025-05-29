const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const student_controller = require("../controllers/student_management/student.controller");
const upload = require('../middleware/uploader')

module.exports = function (app) {
  app.post("/api/get_plans", [authJwt.verifyToken], student_controller.getsubscriptionPlans);
  app.post("/api/get_country", [authJwt.verifyToken], student_controller.getCountryList);
  app.post("/api/add_student", [authJwt.verifyToken], student_controller.addStudentsFunction);
  app.post("/api/get_students", [authJwt.verifyToken], student_controller.getStudentDetails);
  app.post("/api/update_student", [authJwt.verifyToken], student_controller.updateStudentDetails);
  app.post("/api/delete_student", [authJwt.verifyToken], student_controller.deleteStudentData);
  app.post('/api/upload/image',[authJwt.verifyToken],upload.single("file"),student_controller.savestudentImage)
};
