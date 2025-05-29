const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const controller = require("../controllers/authentication/auth.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {res.header("Access-Control-Allow-Headers","x-access-token, Origin, Content-Type, Accept");next();});
  app.post("/api/auth/signup",[verifySignUp.checkDuplicateUsernameOrEmail,authJwt.verifyToken],controller.signup);
  app.post("/api/auth/forget_mail",controller.forgetpasswordMail);
  app.post("/api/auth/signin", controller.signin);
  app.post("/api/changepassword", controller.changepassword);
  app.post("/api/change_user_password", controller.userchangepassword);
  app.post("/api/reset_password", [authJwt.verifyToken], controller.resetnewPassword);
  //token validation 
  app.post("/api/validation",controller.tokenValidation)
};