const db = require("../models");
const config = require("../config/constants.js");
const ROLES = db.Role;
const User = db.User;
checkDuplicateUsernameOrEmail = (req, res, next) => {
  // Username
  User.findOne({
    where: {
      email: req.body.email
    }
  }).then(user => {
    if (user) { 
      res.status(config.HTTP_STATUS.VALIDATION_ERROR.code).send({
        "status":config.HTTP_STATUS.VALIDATION_ERROR,
        "response": {
          "message":  "Email is already in use."
        }
    });
      return;
    } 
    next(); 
  });
}; 
const verifySignUp = {
  checkDuplicateUsernameOrEmail: checkDuplicateUsernameOrEmail 
};
module.exports = verifySignUp;