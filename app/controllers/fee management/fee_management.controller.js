const db = require("../../models");
const config = require("../../config/constants.js");
const moment = require("moment/moment.js");
const { Op, fn, col, where } = require("sequelize");
const mailhelper = require("../../helpers/mailer.js");
var handlebars = require("handlebars");
var fs = require("fs");
var path = require("path");

const Student = db.Student;
const StudentPlan = db.StudentPlan;
const Fee_Management = db.Fee_Management;
const Subscription = db.Subscription;
const StudentAddon = db.StudentAddon;
const AddOn = db.AddOn;
const SubscriptionDays = db.SubscriptionDays;

// exports.saveFeeDetailsOfStudents = async function (req, res) {
//   try {
//     const studentData = await Student.findAll({
//       attributes: ["id"],
//       include: [
//         {
//           model: StudentPlan,
//           attributes: [
//             "id",
//             "plan_id",
//             "start_date",
//             "discount_amount",
//             "plan_amount",
//             "add_on_amount",
//             "total_amount",
//           ],
//         },
//       ],
//     });

//     // const dueDate = moment().add(1, "month").startOf("month").toDate();

//     for (let student of studentData) {
//       const joiningDate = new Date(student.StudentPlan.start_date);
//       const dueDate = new Date(joiningDate);
//       dueDate.setMonth(joiningDate.getMonth() + 1);

//       let formattedDate = moment(dueDate).format("YYYY-MM-DD");

//       console.log(formattedDate,"--------");

//       const isExist = await Fee_Management.findOne({
//         where: {
//           student_id: student.id,
//           due_date: {
//             [Op.eq]: new Date(formattedDate),
//           },
//         },
//       });

//       if (!isExist) {
//         const feeData = {
//           student_id: student.id,
//           plan_id: student.StudentPlan.id,
//           due_date: formattedDate,
//           plan_amount: student.StudentPlan.plan_amount,
//           add_on_amount: student.StudentPlan.add_on_amount,
//           discount: student.StudentPlan.discount_amount,
//           total_amount: student.StudentPlan.total_amount,
//           paid_amount: 0,
//         };

//         // await Fee_Management.create(feeData);
//       }
//     }

//     res.status(config.HTTP_STATUS.SUCCESS.code).send({
//       status: config.HTTP_STATUS.SUCCESS,
//       response: {
//         message: "Fee Management",
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
//       status: config.HTTP_STATUS.INTERNAL_SERVER,
//       response: {
//         message: error,
//       },
//     });
//   }
// };

exports.saveFeeDetailsOfStudents = async function (req, res) {
  try {
    const studentData = await Student.findAll({
      attributes: ["id"],
      include: [
        {
          model: StudentPlan,
          attributes: [
            "id",
            "plan_id",
            "start_date",
            "discount_amount",
            "plan_amount",
            "add_on_amount",
            "total_amount",
          ],
        },
      ],
    });

    for (let student of studentData) {
      let startDate = moment(student.StudentPlan.start_date);
      let currentMonth = moment().startOf("month");

      while (
        startDate.isBefore(currentMonth) ||
        startDate.isSame(currentMonth)
      ) {
        let dueDate = moment(startDate).add(1, "month").startOf("month");

        const formattedDate = dueDate.format("YYYY-MM-DD");

        const isExist = await Fee_Management.findOne({
          where: {
            student_id: student.id,
            due_date: {
              [Op.eq]: new Date(formattedDate),
            },
          },
        });

        if (!isExist) {
          const feeData = {
            student_id: student.id,
            plan_id: student.StudentPlan.id,
            due_date: formattedDate,
            plan_amount: student.StudentPlan.plan_amount,
            add_on_amount: student.StudentPlan.add_on_amount,
            discount: student.StudentPlan.discount_amount,
            total_amount: student.StudentPlan.total_amount,
            paid_amount: 0,
          };

          await Fee_Management.create(feeData);
        }

        startDate.add(1, "month");
      }
    }

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Fee Management",
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

exports.getStudentFeemanagement = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let searchCondition = {};
    let whereCondition = {};

    if (req.body.type == 1) {
      whereCondition = {
        ...whereCondition,
        status: { [Op.in]: ["overdue"] },
      };
    }

    if (req.body.searchKey) {
      searchCondition = {
        ...searchCondition,
        [Op.or]: [
          { first_name: { [Op.like]: `%${req.body.searchKey}%` } },
          { last_name: { [Op.like]: `%${req.body.searchKey}%` } },
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

    if (req.body.monthfilter) {
      const [year, month] = req.body.monthfilter.split("-");

      whereCondition = {
        ...whereCondition,
        [Op.and]: [
          db.Sequelize.where(
            db.Sequelize.fn("YEAR", db.Sequelize.col("due_date")),
            year
          ),
          db.Sequelize.where(
            db.Sequelize.fn("MONTH", db.Sequelize.col("due_date")),
            month
          ),
        ],
      };
    }

    const { filter } = req.body;

    // if (filter.plan) {
    //   whereCondition = {
    //     ...whereCondition,
    //     [Op.or]: [
    //       {
    //         "$StudentPlan.Subscription.plan_name$": {
    //           [Op.like]: `%${filter.plan}%`,
    //         },
    //       },
    //     ],
    //   };
    // }

    // if (filter.add_on) {
    //   whereCondition = {
    //     ...whereCondition,
    //     [Op.or]: [
    //       {
    //         "$StudentPlan.addon.AddOn.plan_name$": {
    //           [Op.like]: `%${filter.add_on}%`,
    //         },
    //       },
    //     ],
    //   };
    // }

    const feeData = await Fee_Management.findAndCountAll({
      distinct: true,
      where: whereCondition,
      include: [
        {
          model: Student,
          as: "Student",
          where: searchCondition,
          attributes: ["id", "first_name", "last_name", "profile_pic"],
        },
        {
          model: StudentPlan,
          attributes: ["id", "plan_id", "discount_id"],
          include: [
            {
              model: StudentAddon,
              as: "addon",
              attributes: ["id", "add_on_id"],
              include: [
                {
                  model: AddOn,
                  attributes: { exclude: ["createdAt", "updatedAt"] },
                },
              ],
            },
            {
              model: Subscription,
              attributes: { exclude: ["createdAt", "updatedAt"] },
              include: [
                {
                  model: SubscriptionDays,
                  attributes: { exclude: ["createdAt", "updatedAt"] },
                },
              ],
            },
          ],
        },
      ],
      order: [
        ["due_date", "DESC"],
        // ["Student", "first_name", "ASC"],
      ],
      offset,
      limit,
    });

    let formattedArr = [];

    feeData?.rows?.forEach((element) => {
      let formattedData = {};
      let days = [];
      if (element?.StudentPlan?.Subscription?.Subscription_Days?.length) {
        for (let val of element?.StudentPlan?.Subscription?.Subscription_Days) {
          days.push(val.day);
        }
      }

      let addons = [];
      if (element?.StudentPlan?.addon.length) {
        for (let val of element?.StudentPlan?.addon) {
          addons.push(val?.Add_on?.plan_name);
        }
      }

      formattedData = {
        id: element?.id,
        student_name:
          element?.Student?.first_name + " " + element?.Student?.last_name,
        student_id: element?.student_id,
        profile_pic: element?.Student?.profile_pic,
        plan_name: element?.StudentPlan?.Subscription?.plan_name,
        available_days: days,
        from_time: element?.StudentPlan?.Subscription?.from_time,
        to_time: element?.StudentPlan?.Subscription?.to_time,
        addons: addons,
        plan_amount: element?.plan_amount,
        addon_amount: element?.add_on_amount,
        discount: element?.discount,
        total_amount: element?.total_amount,
        due: element?.status == "paid" ? 0 : element?.total_amount,
        due_date: element?.due_date,
        status: element?.status,
        paid_amount: element?.paid_amount,
        payment_method: element?.payment_method,
      };

      formattedArr.push(formattedData);
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Get Fee Management Data",
        count: feeData.count,
        data: formattedArr,
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

exports.updateFeeManagementOfStduent = async function (req, res) {
  try {
    const receivefilePath = path.join(
      __dirname,
      "../../helpers/templates/payment_received.html"
    );
    const receiveSource = fs.readFileSync(receivefilePath, "utf-8").toString();
    const receiveTemplate = handlebars.compile(receiveSource);
    //--------------------------------------------------------------

    const collectfilePath = path.join(
      __dirname,
      "../../helpers/templates/payment_collect.html"
    );
    const collectSource = fs.readFileSync(collectfilePath, "utf-8").toString();
    const collectTemplate = handlebars.compile(collectSource);

    //--------------------------------------------------------------

    const isExist = await Fee_Management.findOne({
      where: {
        id: req.body.id,
      },
      include: [
        {
          model: Student,
          attributes: ["first_name", "last_name", "email"],
        },
        {
          model: StudentPlan,
          attributes: ["id"],
          include: [
            {
              model: Subscription,
              attributes: ["plan_name"],
            },
          ],
        },
      ],
    });

    if (!isExist) {
      res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Student Fee Record Not Found.",
        },
      });
    }

    if (isExist.status == "paid") {
      res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message: "Student Fee Already Recorded.",
        },
      });
    }

    const updateData = {
      paid_amount: isExist?.total_amount,
      payment_method: req.body.payment_method,
      collected_by: req.body.collected_by,
      collected_date: moment().format("YYYY-MM-DD"),
      status: "paid",
    };

    await Fee_Management.update(updateData, {
      where: {
        id: req.body.id,
      },
    });

    const replacements = {
      username:
        isExist?.Student?.first_name + " " + isExist?.Student?.last_name || "",
      plan_name: isExist?.StudentPlan?.Subscription?.plan_name || "",
      amount: isExist?.total_amount || "",
      payment_method: req.body.payment_method || "",
      fee_period: moment().format("MMMM YYYY") || "",
    };

    const studenthtmlToSend = receiveTemplate(replacements);

    const adminhtmlToSend = collectTemplate(replacements);

    await mailhelper.sendMail(
      isExist?.Student?.email,
      // "abivdocme@gmail.com",
      "Fee Payment Update: Payment Received",
      studenthtmlToSend
    );

    await mailhelper.sendMail(
      "abivdocme@gmail.com",
      `Student Fee Collection: Payment Details for ${
        isExist?.Student?.first_name + " " + isExist?.Student?.last_name
      }`,
      adminhtmlToSend
    );

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Student Fee Recorded Successfully.",
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

exports.handleSendAlert = async function (req, res) {
  try {
    const filePath = path.join(
      __dirname,
      "../../helpers/templates/payment_due.html"
    );

    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = handlebars.compile(source);

    const feeDetails = await Fee_Management.findOne({
      where: {
        id: req.body.id,
      },
      include: [
        {
          model: Student,
          attributes: ["first_name", "last_name", "email"],
        },
        {
          model: StudentPlan,
          attributes: ["id"],
          include: [
            {
              model: Subscription,
              attributes: ["plan_name"],
            },
          ],
        },
      ],
    });

    if (!feeDetails) {
      return res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Student Fee Record Not Found.",
        },
      });
    }

    const isExist = await Student.findOne({
      where: {
        id: feeDetails.student_id,
      },
    });

    if (!isExist) {
      return res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Student Not Found.",
        },
      });
    }

    const replacements = {
      username: isExist?.first_name + " " + isExist?.last_name || "",
      plan_name: feeDetails?.StudentPlan?.Subscription?.plan_name || "",
      amount: feeDetails?.total_amount || "",
      fee_period: moment(feeDetails?.due_date).format("MMMM YYYY") || "",
    };

    const htmlToSend = template(replacements);

    await mailhelper.sendMail(
      isExist?.email,
      // "abivdocme@gmail.com",
      "Fee Payment Due: Immediate Attention Required",
      htmlToSend
    );

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Alert sent to Student.",
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

exports.handleSendAlertToAll = async function (req, res) {
  try {
    const filePath = path.join(
      __dirname,
      "../../helpers/templates/payment_due.html"
    );

    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = handlebars.compile(source);

    //-------------------------------------------------

    let whereCondition = { status: { [Op.in]: ["overdue"] } };
    let searchCondition = {};

    if (req.body.searchKey) {
      searchCondition = {
        ...searchCondition,
        [Op.or]: [
          { first_name: { [Op.like]: `%${req.body.searchKey}%` } },
          { last_name: { [Op.like]: `%${req.body.searchKey}%` } },
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

    if (req.body.monthfilter) {
      const [year, month] = req.body.monthfilter.split("-");

      whereCondition = {
        ...whereCondition,
        [Op.and]: [
          db.Sequelize.where(
            db.Sequelize.fn("YEAR", db.Sequelize.col("due_date")),
            year
          ),
          db.Sequelize.where(
            db.Sequelize.fn("MONTH", db.Sequelize.col("due_date")),
            month
          ),
        ],
      };
    }

    const feeDetails = await Fee_Management.findAll({
      where: whereCondition,
      include: [
        {
          model: Student,
          where: searchCondition,
          attributes: ["first_name", "last_name", "email"],
        },
        {
          model: StudentPlan,
          attributes: ["id"],
          include: [
            {
              model: Subscription,
              attributes: ["plan_name"],
            },
          ],
        },
      ],
    });

    if (feeDetails.length == 0) {
      return res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Student Fee Record Not Found.",
        },
      });
    }

    for (let val of feeDetails) {
      const replacements = {
        username:
          val?.Student?.first_name + " " + val?.Student?.last_name || "",
        plan_name: val?.StudentPlan?.Subscription?.plan_name || "",
        amount: val?.total_amount || "",
        fee_period: moment(val.due_date).format("MMMM YYYY") || "",
      };

      const htmlToSend = template(replacements);

      await mailhelper.sendMail(
        val?.Student?.email,
        // "abivdocme@gmail.com",
        "Fee Payment Due: Immediate Attention Required",
        htmlToSend
      );
    }

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Alert sent to All.",
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
