const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const user_controller = require("../controllers/user/user.controller");

module.exports = function (app) {
  app.get("/api/modules", [authJwt.verifyToken], user_controller.getModuleList);
  app.post("/api/add_user", [authJwt.verifyToken], user_controller.addUserFunction);
  app.post("/api/add_role", [authJwt.verifyToken], user_controller.addRoleFunction);
  app.post("/api/get_role", [authJwt.verifyToken], user_controller.getRoleList);
  app.post("/api/get_user", [authJwt.verifyToken], user_controller.getUserList);
  app.post("/api/update_user", [authJwt.verifyToken], user_controller.userUpdateFunction);
  app.post("/api/update_role", [authJwt.verifyToken], user_controller.updateUserRole);
  app.post("/api/delete_role", [authJwt.verifyToken], user_controller.deleteuserRoles);
  app.post("/api/delete_user", [authJwt.verifyToken], user_controller.deleteuserfunction);
  app.post("/api/user/profile", [authJwt.verifyToken], user_controller.getUserprofileData);
  app.post("/api/user/profile_update", [authJwt.verifyToken], user_controller.userProfileUpdate);
};
