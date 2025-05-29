const db = require("../../models");
const config = require("../../config/constants.js");
const Op = db.Sequelize.Op;
var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
var commonHelper = require("../../helpers/mailer.js");
const request = require("request");
const mailhelper = require("../../helpers/mailer.js");

const User = db.User;
const Role = db.Role;
const Company = db.company;
const Module = db.Module;

exports.signup = (req, res) => {
  var handlebars = require("handlebars");
  var fs = require("fs");
  var path = require("path");
  // Save User to Database  password
  let password = req.body.password
    ? req.body.password
    : Math.random().toString(36).substring(2, 6) +
      Math.random().toString(36).substring(2, 6);
  // console.log(password);
  User.create({
    name: req.body.full_name,
    email: req.body.email,
    profile_pic: req.body.profile_pic,
    password: bcrypt.hashSync(password, 8),
    role: req.body.role_id,
    mobile: req.body.mobile,
  })
    .then((user) => {
      if (config.MAILERSTATUS) {
        const filePath = path.join(
          __dirname,
          "../../helpers/templates/signup.html"
        );
        const source = fs.readFileSync(filePath, "utf-8").toString();
        const template = handlebars.compile(source);

        // const replacements = {
        //   username: req.body.full_name,
        //   email: req.body.email,
        //   password: password,
        //   path: process.env.SERVER_URL,
        // };

        // const htmlToSend = template(replacements);
        // sendnotificationAsmail(
        //   req.body.email,
        //   "JVT Farm - User created",
        //   htmlToSend
        // );
      }
      res.status(config.HTTP_STATUS.CREATED.code).send({
        status: config.HTTP_STATUS.CREATED,
        response: {
          message: "User Created Successfully.",
          user_id: user.user_id,
        },
      });
    })
    .catch((err) => {
      res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
        status: config.HTTP_STATUS.INTERNAL_SERVER,
        response: {
          message: err.errors
            ? err.errors.map((e) => e.message)[0]
            : err.message,
        },
      });
    });
};

exports.signin = (req, res) => {
  User.findOne({
    where: {
      email: req.body.email,
    },
    include: [
      {
        model: Role,
        attributes: ["id", "role_name", "module_privileges"],
      },
    ],
  })
    .then(async (user) => {
      if (!user) {
        return res.status(config.HTTP_STATUS.LOGIN_ERROR.code).send({
          status: config.HTTP_STATUS.LOGIN_ERROR,
          response: {
            message:
              "Invalid login credentials. Please check your email id and password.",
          },
        });
      }
      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );
      if (!passwordIsValid) {
        return res.status(config.HTTP_STATUS.LOGIN_ERROR.code).send({
          status: config.HTTP_STATUS.LOGIN_ERROR,
          response: {
            accessToken: null,
            message:
              "Invalid login credentials. Please check your email id and password.",
          },
        });
      }
      if (!user.status) {
        return res.status(config.HTTP_STATUS.FORBIDDEN.code).send({
          status: config.HTTP_STATUS.FORBIDDEN,
          response: {
            accessToken: null,
            message:
              "Your account is currently inactive. Please contact support for assistance.",
          },
        });
      }
      var token = jwt.sign(
        { id: user.id, role: user.Role.role_name, role_id: user.Role.id },
        config.secret,
        {
          expiresIn: 86400, // 24 hours
        }
      );
      var authorities = [];
      res.status(config.HTTP_STATUS.SUCCESS.code).send({
        status: config.HTTP_STATUS.SUCCESS,
        response: {
          message: "Successfully logged In",
          accessToken: token,
          data: {
            user_id: user.id,
            full_name: user.first_name + " " + user.last_name,
            email: user.email,
            mobile: user.mobile,
            profile_pic: user.profile_pic,
            role: {
              id: user.Role.id,
              role_name: user.Role.role_name,
              module_privileges: JSON.parse(user.Role.module_privileges),
            },
            // privileges: await require('../../api-v2/api/rbac/privilege/service').getRolePermissions(user.rde_role.role_id)
          },
        },
      });
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
};

function randomString(length) {
  var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  for (var i = length; i > 0; --i)
    result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

exports.forgetpasswordMail = async function (req, res) {
  try {
    var handlebars = require("handlebars");
    var fs = require("fs");
    var path = require("path");

    const filePath = path.join(
      __dirname,
      "../../helpers/templates/resetpassword.html"
    );
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = handlebars.compile(source);

    const isUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!isUser) {
      res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Invalid Email ID",
        },
      });
    }

    const token = jwt.sign(
      { email: isUser.email, id: isUser.id },
      process.env.SECRET_TOKEN,
      {
        expiresIn: "15m",
      }
    );

    let resetLink =
      process.env.CLIENT_URL + `forgot_password/${isUser.id}/${token}`;
    let resetLinkshort;

    if (resetLink.length >= 30) {
      resetLinkshort = resetLink.substring(0, 30) + "...";
    }

    const replacements = {
      username: isUser.first_name + " " + isUser.last_name,
      resetLink: resetLink,
      resetLinkshort: resetLinkshort,
    };
    const htmlToSend = template(replacements);

    await mailhelper.sendMail(
      req.body.email,
      "Password Assistance: Reset Your Account Password.",
      htmlToSend
    );

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: `Please check your email. We have sent the reset email to .`,
      },
    });
  } catch (error) {
    console.log(error);

    res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
      status: config.HTTP_STATUS.INTERNAL_SERVER,
      response: {
        message: error,
      },
    });
  }
};

exports.userchangepassword = async (req, res) => {
  try {
    if (
      req.body.user_id === "" ||
      req.body.user_id === null ||
      req.body.user_id === undefined
    ) {
      return res.status(config.HTTP_STATUS.BAD_REQUEST.code).send({
        status: config.HTTP_STATUS.BAD_REQUEST,
        response: {
          message: "User id not found",
        },
      });
    }

    var user_id = req.body.user_id;
    var password = bcrypt.hashSync(req.body.password, 8);

    const existingData = await User.findOne({
      where: {
        id: req.body.user_id,
      },
    });

    let passwordIsValid = bcrypt.compareSync(
      req.body.password,
      existingData.password
    );

    if (passwordIsValid) {
      return res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message:
            "New password cannot match the current one. Please choose a different password.",
        },
      });
    }

    //password updating
    var updateData = {
      password: password,
    };
    await User.update(updateData, {
      where: { id: user_id },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "User Password Updated Successfully.",
      },
    });
  } catch (error) {
    console.log(error);
    res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
      status: config.HTTP_STATUS.INTERNAL_SERVER,
      response: {
        message:
          error.message || "Some error occurred while updating user password.",
      },
    });
  }
};

exports.changepassword = async (req, res) => {
  var handlebars = require("handlebars");
  var fs = require("fs");
  var path = require("path");

  var email = req.body.email;
  var token = req.body.token;
  var password = bcrypt.hashSync(req.body.password, 8);
  var usercheck = "";
  usercheck = await User.findOne({
    where: {
      email: email,
      reset_token: token,
    },
    attributes: { exclude: ["createdAt", "updatedAt", "password"] },
  });

  if (usercheck == null) {
    res.status(config.HTTP_STATUS.BAD_REQUEST.code).send({
      status: config.HTTP_STATUS.BAD_REQUEST,
      response: {
        message: "Auth Failed",
      },
    });
  } else {
    //password updating
    var updateData = {
      reset_token: null,
      password: password,
    };
    await User.update(updateData, {
      where: { email: email },
    });
    //mail send
    const filePath = path.join(
      __dirname,
      "../../helpers/templates/changepassword.html"
    );
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = handlebars.compile(source);
    const replacements = {
      username: usercheck.full_name,
    };
    const htmlToSend = template(replacements);
    commonHelper.sendMail(
      usercheck.email,
      "Motus One RDE - Password Changed",
      htmlToSend
    );

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "User Password  Successfully Updated.",
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: usercheck,
      },
    });
  }
};

exports.resetnewPassword = async (req, res) => {
  try {
    const { user_id, current_password, new_password, confirm_password } =
      req.body;

    if (new_password !== confirm_password) {
      return res.status(config.HTTP_STATUS.BAD_REQUEST.code).send({
        status: config.HTTP_STATUS.BAD_REQUEST,
        response: {
          message: "New Password and Confirm Password must Match.",
        },
      });
    }

    const user = await User.findByPk(user_id);

    const passwordIsValid = bcrypt.compareSync(current_password, user.password);

    if (!passwordIsValid) {
      return res.status(config.HTTP_STATUS.NOT_AUTHENTICATED.code).send({
        status: config.HTTP_STATUS.NOT_AUTHENTICATED,
        response: {
          message: "Invalid Current Password.",
        },
      });
    }

    const hashedNewPassword = bcrypt.hashSync(new_password, 8);

    await User.update(
      { password: hashedNewPassword },
      {
        where: {
          id: user_id,
        },
      }
    );

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Password reset successfully.",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
      status: config.HTTP_STATUS.INTERNAL_SERVER,
      response: {
        message: "Internal server error.",
      },
    });
  }
};

exports.tokenValidation = async function (req, res) {
  try {
    let token = req.body.token;

    jwt.verify(token, config.secret, (err, resp) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(config.HTTP_STATUS.VALIDATION_ERROR.code).send({
            status: config.HTTP_STATUS.VALIDATION_ERROR,
            response: {
              message: "Token expired, please log in again.",
            },
          });
        }
        return res.status(config.HTTP_STATUS.VALIDATION_ERROR.code).send({
          status: config.HTTP_STATUS.VALIDATION_ERROR,
          response: {
            message: "Invalid token.",
          },
        });
      }

      res.status(config.HTTP_STATUS.SUCCESS.code).send({
        status: config.HTTP_STATUS.SUCCESS,
        response: {
          message: "Token is not expired.",
        },
      });
    });
  } catch (error) {
    console.error(error);
    res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
      status: config.HTTP_STATUS.INTERNAL_SERVER,
      response: {
        message: "Internal server error.",
      },
    });
  }
};