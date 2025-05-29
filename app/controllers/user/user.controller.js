const db = require("../../models");
const config = require("../../config/constants.js");
var bcrypt = require("bcryptjs");
const request = require("request");
var handlebars = require("handlebars");
var fs = require("fs");
var path = require("path");
const { Op } = require("sequelize");

const Module = db.Module;
const User = db.User;
const Role = db.Role;

exports.getModuleList = async function (req, res) {
  try {
    const moduleList = await Module.findAll({
      attributes: ["id", "module_name"],
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Module list....",
        data: moduleList,
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

exports.addUserFunction = async function (req, res) {
  try {
    const isExisit = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (isExisit) {
      return res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message: "User Already Exist",
        },
      });
    }

    let password = generateRandomPassword();
    // let password = "123456";
    let hashedNewPassword = bcrypt.hashSync(password, 10);

    let userData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      role: req.body.role,
      status: req.body.status == "active" ? 1 : 0,
      password: hashedNewPassword,
    };

    await User.create(userData);

    const filePath = path.join(
      __dirname,
      "../../helpers/templates/signup.html"
    );
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = handlebars.compile(source);

    const replacements = {
      username: req.body.full_name + " " + req.body.last_name,
      email: req.body.email,
      password: password,
      //   path: process.env.SERVER_URL,
    };

    const htmlToSend = template(replacements);

    sendnotificationAsmail(
      req.body.email,
      "TOSS Academy - User created",
      htmlToSend
    );

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "User Added Successfully.",
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

function generateRandomPassword() {
  const length = 6;
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let password = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    password += characters[randomIndex];
  }

  return password;
}

const sendnotificationAsmail = async (user_email, subject, htmlToSend) => {
  try {
    let sync_url =
      "https://sestrack.technoalliance.in/v1/bmclinic_notification";

    let bodyData = {
      instituion: "NIMS_DXB",
      subject: subject,
      message: htmlToSend,
      mail_data: [
        {
          parent_name: "",
          parent_email: user_email,
        },
      ],
    };

    return new Promise(function (resolve, reject) {
      request.post(
        {
          headers: {
            "content-type": "application/json",
          },
          url: sync_url,
          body: JSON.stringify(bodyData),
        },
        (err, res, body) => {
          try {
            if (err) {
              console.log("err:::::", err);
              return resolve(false);
            }

            let parseBody = JSON.parse(body);
            console.log("__________________", parseBody, "__________________");
            if (parseBody) {
              return resolve(parseBody);
            } else {
              return resolve(null);
            }
          } catch (error) {
            resolve(null);
          }
        }
      );
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.addRoleFunction = async function (req, res) {
  try {
    const isExisit = await Role.findOne({
      where: {
        role_name: req.body.role_name,
      },
    });

    if (isExisit) {
      return res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message: "Role Already Exists.",
        },
      });
    }

    const roleData = {
      role_name: req.body.role_name,
      module_privileges: req.body.permissions,
    };

    await Role.create(roleData);

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Role and Permissions Added Successfully.",
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

exports.getRoleList = async function (req, res) {
  try {
    let whereCondition = {};

    if (req.body.searchKey) {
      whereCondition.role_name = { [Op.like]: `%${req.body.searchKey}%` };
    }

    const roleData = await Role.findAll({
      where: whereCondition,
      attributes: ["id", "role_name", "module_privileges"],
      order: [["role_name", "ASC"]],
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Roles List.",
        data: roleData,
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

exports.getUserList = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let whereCondition = {};

    if (req.body.searchKey) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { first_name: { [Op.like]: `%${req.body.searchKey}%` } },
          { last_name: { [Op.like]: `%${req.body.searchKey}%` } },
          { email: { [Op.like]: `%${req.body.searchKey}%` } },
          {
            [Op.and]: [
              {
                first_name: {
                  [Op.like]: `%${req.body.searchKey.split(" ")[0]}%`,
                },
              },
              {
                last_name: {
                  [Op.like]: `%${req.body.searchKey.split(" ")[1] || ""}%`,
                },
              },
            ],
          },
        ],
      };
    }

    const userData = await User.findAll({
      where: whereCondition,
      include: [
        {
          model: Role,
          attributes: ["id", "role_name", "module_privileges"],
        },
      ],
      attributes: { exclude: ["createdAt", "updatedAt", "role", "password"] },
      order: [["first_name", "ASC"]],
      offset,
      limit,
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "User List.",
        data: userData,
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

exports.userUpdateFunction = async function (req, res) {
  try {
    let userData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      role: req.body.role,
      status: req.body.status == "active" ? 1 : 0,
    };

    await User.update(userData, {
      where: {
        id: req.body.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "User Updated Successfully.",
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

exports.updateUserRole = async function (req, res) {
  try {
    const roleData = {
      role_name: req.body.role_name,
      module_privileges: req.body.permissions,
    };

    await Role.update(roleData, {
      where: {
        id: req.body.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Role Updated Successfully.",
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

exports.deleteuserRoles = async function (req, res) {
  try {
    const isExisit = await Role.findOne({
      where: {
        id: req.body.id,
      },
    });

    if (!isExisit) {
      return res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Role Not Found.",
        },
      });
    }

    const isRoleAssigned = await User.findOne({
      where: {
        role: req.body.id,
      },
    });

    if (isRoleAssigned) {
      return res.status(config.HTTP_STATUS.FORBIDDEN.code).send({
        status: config.HTTP_STATUS.FORBIDDEN,
        response: {
          message: "Role is assigned to users and cannot be deleted.",
        },
      });
    }

    await Role.destroy({
      where: {
        id: req.body.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Role Deleted Successfully.",
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

exports.deleteuserfunction = async function (req, res) {
  try {
    const isExisit = await User.findOne({
      where: {
        id: req.body.id,
      },
    });

    if (!isExisit) {
      return res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "User Not Found.",
        },
      });
    }

    const isAssigned = await db.Subscription.findOne({
      where: {
        in_charge: req.body.id,
      },
    });

    if (isAssigned) {
      return res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message: "User deletion restricted. User manages a subscription. Reassign first.",
        },
      });
    }

    await User.destroy({
      where: {
        id: req.body.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "User Deleted Successfully.",
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

exports.getUserprofileData = async function (req, res) {
  try {
    const userData = await User.findOne({
      where: {
        id: req.body.user_id,
      },
      attributes: ["id", "first_name", "last_name", "profile_pic", "email"],
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "User Profile.",
        data: userData,
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

exports.userProfileUpdate = async function (req, res) {
  try {
    let updateData = {
      profile_pic: req.body.profile_pic,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
    };

    await User.update(updateData, {
      where: {
        id: req.body.user_id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Profile Updated Successfully.",
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
