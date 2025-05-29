const db = require("../../models");
const config = require("../../config/constants.js");
const { Op, where } = require("sequelize");

const Subscription = db.Subscription;
const SubscriptionDays = db.SubscriptionDays;
const Student = db.Student;
const StudentPlan = db.StudentPlan;
const Attendance = db.Attendance;

exports.addSubscription = async function (req, res) {
  try {
    if (
      !req.body.plan_name ||
      !req.body.plan_charge ||
      !req.body.available_days ||
      req.body.available_days.length === 0 ||
      !req.body.from_time ||
      !req.body.to_time ||
      !req.body.in_charge ||
      !req.body.fee_collect_type
    ) {
      return res
        .status(400)
        .json({ message: "All fields are required and must be filled." });
    }

    // const isExist = await Subscription.findOne({
    //   where: {
    //     plan_name: req.body.plan_name,
    //   },
    // });

    // if (isExist) {
    //   res.status(config.HTTP_STATUS.EXIST.code).send({
    //     status: config.HTTP_STATUS.EXIST,
    //     response: {
    //       message: "Subscription Already Exist.",
    //     },
    //   });
    // }

    const subscriptionData = {
      plan_name: req.body.plan_name,
      plan_charge: req.body.plan_charge,
      //   available_days: req.body.available_days,
      from_time: req.body.from_time,
      to_time: req.body.to_time,
      in_charge: req.body.in_charge,
      fee_collect_type: req.body.fee_collect_type,
      created_by: req.body.created_by,
    };

    const newSubscription = await Subscription.create(subscriptionData);

    for (let val of req.body.available_days) {
      const availabeDays = {
        plan_id: newSubscription.id,
        day: val,
      };

      await SubscriptionDays.create(availabeDays);
    }

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Subscription Added Successfully.",
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

exports.getSubscriptions = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let whereCondition = {};

    if (req.body.searchKey) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [{ plan_name: { [Op.like]: `%${req.body.searchKey}%` } }],
      };
    }

    const subscriptionList = await Subscription.findAndCountAll({
      where: whereCondition,
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: db.User,
          attributes: ["first_name", "last_name"],
        },
      ],
      order: [["id", "DESC"]],
      distinct: true,
      offset,
      limit,
    });

    const formattedData = [];

    for (let val of subscriptionList.rows) {
      const subscriptionDaysList = await SubscriptionDays.findAll({
        where: {
          plan_id: val.id,
        },
      });

      let subData = {};
      subData = { ...val.dataValues };

      let days = [];

      subscriptionDaysList.forEach((element) => {
        days.push(element.day);
      });

      subData.available_days = days;

      const studentCountData = await StudentPlan.count({
        where: {
          plan_id: val.id,
        },
      });

      subData.student_count = studentCountData;

      formattedData.push(subData);
    }

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Subscription List.",
        count: subscriptionList.count,
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

exports.updateSubscription = async function (req, res) {
  try {
    const updateData = Object.fromEntries(
      Object.entries({
        plan_name: req.body.plan_name,
        plan_charge: req.body.plan_charge,
        // available_days: req.body.available_days,
        from_time: req.body.from_time,
        to_time: req.body.to_time,
        in_charge: req.body.in_charge,
        fee_collect_type: req.body.fee_collect_type,
        created_by: req.body.created_by,
      }).filter(
        ([_, value]) => value !== undefined && value !== null && value !== ""
      )
    );

    await Subscription.update(updateData, {
      where: {
        id: req.body.id,
      },
    });

    await SubscriptionDays.destroy({
      where: {
        plan_id: req.body.id,
      },
    });

    for (let val of req.body.available_days) {
      const dayUpdateData = {
        plan_id: req.body.id,
        day: val,
      };

      await SubscriptionDays.create(dayUpdateData);
    }

    await res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Subscription Updated Successfully.",
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

exports.getPlanAndStudentCount = async function (req, res) {
  try {
    const planData = await StudentPlan.findAll({
      attributes: [
        "plan_id",
        [
          db.Sequelize.fn("COUNT", db.Sequelize.col("student_id")),
          "student_count",
        ],
      ],
      include: [
        {
          model: Subscription,
          attributes: ["plan_name"],
        },
      ],
      group: ["plan_id"],
      raw: true,
      order: [[db.Sequelize.literal("student_count"), "DESC"]],
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Fetch data",
        data: planData,
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
