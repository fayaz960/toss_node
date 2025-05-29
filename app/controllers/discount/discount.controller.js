const db = require("../../models");
const config = require("../../config/constants.js");
const { Op } = require("sequelize");

const StudentPlan = db.StudentPlan;

exports.addDiscountfunction = async function (req, res) {
  try {
    const isDiscountExisit = await db.Discount.findOne({
      where: {
        discount_name: req.body.discount_name,
      },
    });

    if (isDiscountExisit) {
      return res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message: "Discount Already Exists.",
        },
      });
    }

    if (req.body.discount_type == "percentage" && req.body.rate > 100) {
      return res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message: "The Discount Percentage Cannot Exceed 100%.",
        },
      });
    }

    const discountData = {
      discount_name: req.body.discount_name,
      discount_type: req.body.discount_type,
      rate: req.body.rate,
      status: req.body.status,
    };

    await db.Discount.create(discountData);

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Discount Added Successfully.",
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

exports.getDiscountList = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let whereCondition = {};

    // if (req.body.searchKey) {
    //   whereCondition.discount_type = { [Op.like]: `%${req.body.searchKey}%` };
    // }

    if (req.body.searchKey) {
      whereCondition = {
        [Op.or]: [
          { discount_type: { [Op.like]: [`%${req.body.searchKey}%`] } },
          { discount_name: { [Op.like]: [`%${req.body.searchKey}%`] } },
        ],
      };
    }

    const discountData = await db.Discount.findAndCountAll({
      where: whereCondition,
      attributes: { exclude: ["createdAt", "updatedAt"] },
      order: [["id", "DESC"]],
      limit,
      offset,
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Discount List.",
        count: discountData.count,
        data: discountData.rows,
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

exports.updateDiscountfunction = async function (req, res) {
  try {
    const isExist = await db.Discount.findOne({
      where: {
        id: req.body.id,
      },
    });

    if (!isExist) {
      return res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Discount Not Found.",
        },
      });
    }

    if (req.body.discount_type == "percentage" && req.body.rate > 100) {
      return res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message: "The Discount Percentage Cannot Exceed 100%.",
        },
      });
    }

    const discountData = {
      discount_name: req.body.discount_name,
      discount_type: req.body.discount_type,
      rate: req.body.rate,
      status: req.body.status,
    };

    await db.Discount.update(discountData, {
      where: {
        id: req.body.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Discount Updated Successfully.",
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

exports.updateDiscountStatus = async function (req, res) {
  try {
    const isExist = await db.Discount.findOne({
      where: {
        id: req.body.id,
      },
    });

    if (!isExist) {
      return res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Discount Not Found.",
        },
      });
    }

    const statusData = {
      status: req.body.status,
    };

    await db.Discount.update(statusData, {
      where: {
        id: req.body.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Discount Status Updated Successfully.",
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

exports.deleteDiscount = async function (req, res) {
  try {
    const isExist = await db.Discount.findOne({
      where: {
        id: req.body.id,
      },
    });

    if (!isExist) {
      return res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Discount Not Found.",
        },
      });
    }

    const isDiscountAssigned = await StudentPlan.findOne({
      where: {
        discount_id: req.body.id,
      },
    });

    if (isDiscountAssigned) {
      return res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message:
            "This discount is currently assigned to a user and cannot be deleted.",
        },
      });
    }

    await db.Discount.destroy({
      where: {
        id: req.body.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Discount Deleted Successfully.",
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
