const db = require("../../models");
const config = require("../../config/constants.js");
const { Op, where } = require("sequelize");
const AddOn = db.AddOn;
const StudentAddon = db.StudentAddon;

exports.addSubscription = async function (req, res) {
  try {
    if (!req.body.plan_name || !req.body.plan_charge) {
      return res
        .status(400)
        .json({ message: "All fields are required and must be filled." });
    }

    const isExist = await AddOn.findOne({
      where: {
        plan_name: req.body.plan_name,
      },
    });

    if (isExist) {
      res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message: "Add on Already Exisits",
        },
      });
    }

    const addOnData = {
      plan_name: req.body.plan_name,
      plan_charge: req.body.plan_charge,
      created_by: req.body.created_by,
    };

    await AddOn.create(addOnData);

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Add on Created Successfully.",
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

exports.getAddOns = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let whereCondition = {};

    if (req.body.searchKey) {
      whereCondition = {
        ...whereCondition,
        plan_name: { [Op.like]: `%${req.body.searchKey}%` },
      };
    }

    const addOnData = await AddOn.findAndCountAll({
      where: whereCondition,
      attributes: { exclude: ["createdAt", "updatedAt"] },
      order: [["id", "DESC"]],
      offset,
      limit,
    });

    let formattedData = [];

    for (let val of addOnData.rows) {
      const result = await StudentAddon.findOne({
        attributes: [
          "add_on_id",
          [
            db.Sequelize.fn("COUNT", db.Sequelize.col("student_id")),
            "student_count",
          ],
        ],
        where: { add_on_id: val.id },
        group: ["add_on_id"],
        raw: true,
      });

      formattedData.push({
        ...val.dataValues,
        student_count: result ? result.student_count : 0,
      });
    }

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Add on List.",
        count: addOnData.count,
        data: formattedData,
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

exports.updateAddons = async function (req, res) {
  try {
    const isExisit = await AddOn.findOne({
      where: {
        id: req.body.id,
      },
    });

    if (!isExisit) {
      return res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Add On Not Found.",
        },
      });
    }

    const addOnData = {
      plan_name: req.body.plan_name,
      plan_charge: req.body.plan_charge,
    };

    await AddOn.update(addOnData, {
      where: {
        id: req.body.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Add on Updated Successfully.",
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
