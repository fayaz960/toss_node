const db = require("../../models");
const config = require("../../config/constants.js");
const moment = require("moment/moment.js");
const { Op, fn, col } = require("sequelize");
const xlsx = require("xlsx");

const Student = db.Student;
const StudentPlan = db.StudentPlan;
const Fee_Management = db.Fee_Management;
const Subscription = db.Subscription;
const StudentAddon = db.StudentAddon;
const AddOn = db.AddOn;
const SubscriptionDays = db.SubscriptionDays;
const Discount = db.Discount;

exports.getReportCountData = async function (req, res) {
  try {
    const studentCount = await Student.count();

    const currentMonth = moment().month() + 1; // Feb = 2
    const currentYear = moment().year();

    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1; // Jan if current is Feb
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const currentMonthCount = await StudentPlan.count({
      where: {
        start_date: {
          [Op.gte]: new Date(`${currentYear}-${currentMonth}-01`),
          [Op.lt]: new Date(`${currentYear}-${currentMonth + 1}-01`),
        },
      },
    });

    const previousMonthCount = await StudentPlan.count({
      where: {
        start_date: {
          [Op.gte]: new Date(`${previousYear}-${previousMonth}-01`),
          [Op.lt]: new Date(`${previousYear}-${previousMonth + 1}-01`),
        },
      },
    });

    const studentPercentage = await calculatePercentage(
      currentMonthCount,
      previousMonthCount
    );

    //----------------------------------------------------------------

    const pendingArrearsCount = await Fee_Management.count({
      where: {
        status: { [Op.in]: ["overdue"] },
      },
    });

    const arrearsCurrentMonth = await Fee_Management.count({
      where: {
        status: { [Op.in]: ["overdue"] },
        due_date: {
          [Op.gte]: new Date(`${currentYear}-${currentMonth}-01`),
          [Op.lt]: new Date(`${currentYear}-${currentMonth + 1}-01`),
        },
      },
    });

    const arrearsPrevMonth = await Fee_Management.count({
      where: {
        status: { [Op.in]: ["overdue"] },
        due_date: {
          [Op.gte]: new Date(`${previousYear}-${previousMonth}-01`),
          [Op.lt]: new Date(`${previousYear}-${previousMonth + 1}-01`),
        },
      },
    });

    const arrearPrecentage = await calculatePercentage(
      arrearsCurrentMonth,
      arrearsPrevMonth
    );

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Report count fetch.",
        data: {
          total_student_count: {
            count: studentCount,
            percentage: studentPercentage,
          },
          pending_arrers_count: {
            count: pendingArrearsCount,
            percentage: arrearPrecentage,
          },
          avg_absent: { count: 0, percentage: 0 },
          inactive_count: { count: 0, percentage: 0 },
        },
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

exports.paymentReportFunction = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let searchCondition = {};
    let whereCondition = {
      status: "paid",
    };

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
            db.Sequelize.fn("YEAR", db.Sequelize.col("collected_date")),
            year
          ),
          db.Sequelize.where(
            db.Sequelize.fn("MONTH", db.Sequelize.col("collected_date")),
            month
          ),
        ],
      };
    }

    let { filter } = req.body;

    // if (filter.plan) {
    //   whereCondition = {
    //     ...whereCondition,
    //     [Op.or]: [
    //       {
    //         "$StudentPlan.Subscription.plan_name$": {
    //           [Op.in]: [filter.plan],
    //         },
    //       },
    //     ],
    //   };
    // }

    if (filter.payment_mode) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [{ payment_method: { [Op.in]: [filter.payment_mode] } }],
      };
    }

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

      let addons = [];
      if (element?.StudentPlan?.addon.length) {
        for (let val of element?.StudentPlan?.addon) {
          addons.push(val?.Add_on?.plan_name);
        }
      }

      formattedData = {
        id: element?.id,
        student_id: element?.student_id,
        student_name:
          element?.Student?.first_name + " " + element?.Student?.last_name,
        profile_pic: element?.Student?.profile_pic,
        plan_name: element?.StudentPlan?.Subscription?.plan_name,
        addons: addons,
        payment_date: element?.collected_date,
        paid_amount: element?.paid_amount,
        payment_method: element?.payment_method,
      };

      formattedArr.push(formattedData);
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Payment Report",
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

exports.arrearReportFunction = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let searchCondition = {};
    let whereCondition = {
      status: "overdue",
    };

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
              model: Subscription,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
          ],
        },
      ],
      order: [["due_date", "DESC"]],
      offset,
      limit,
    });

    const lastPaidData = await Fee_Management.findAll({
      where: {
        status: "paid",
      },
      attributes: [
        "student_id",
        [db.Sequelize.fn("MAX", db.Sequelize.col("due_date")), "due_date"],
      ],
      group: ["student_id"],
      raw: true,
    });

    let formattedArr = [];

    feeData?.rows?.forEach((element) => {
      let formattedData = {};

      formattedData = {
        id: element?.id,
        student_id: element?.student_id,
        student_name:
          element?.Student?.first_name + " " + element?.Student?.last_name,
        profile_pic: element?.Student?.profile_pic,
        plan_name: element?.StudentPlan?.Subscription?.plan_name,
        due_amount: element?.total_amount,
        last_paid_amount:
          lastPaidData?.find((val) => val.student_id == element?.student_id)
            ?.due_date || "",
        due_date: element?.due_date,
      };

      formattedArr.push(formattedData);
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Arrears Report",
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

exports.studentReportFunction = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let searchCondition = {};
    let whereCondition = {};

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
            db.Sequelize.fn("YEAR", db.Sequelize.col("start_date")),
            year
          ),
          db.Sequelize.where(
            db.Sequelize.fn("MONTH", db.Sequelize.col("start_date")),
            month
          ),
        ],
      };
    }

    let { filter } = req.body;

    // if (filter.plan) {
    //   whereCondition = {
    //     ...whereCondition,
    //     [Op.or]: [
    //       {
    //         "$StudentPlan.Subscription.plan_name$": { [Op.in]: [filter.plan] },
    //       },
    //     ],
    //   };
    // }

    const studentData = await Student.findAndCountAll({
      distinct: true,
      where: searchCondition,
      attributes: ["id", "first_name", "last_name", "profile_pic"],
      include: [
        {
          model: StudentPlan,
          where: whereCondition,
          attributes: ["plan_id", "discount_id", "start_date"],
          include: [
            {
              model: Subscription,
              attributes: ["plan_name"],
            },
            {
              model: StudentAddon,
              as: "addon",
              attributes: ["id"],
              include: [
                {
                  model: AddOn,
                  attributes: ["plan_name"],
                },
              ],
            },
            {
              model: Discount,
              attributes: ["discount_name"],
            },
          ],
        },
      ],
      order: [["first_name", "ASC"]],
      offset,
      limit,
    });

    const formattedData = studentData.rows.map((val) => ({
      student_id: val?.id,
      student_name: val?.first_name + " " + val?.last_name,
      profile_pic: val?.profile_pic,
      plan_name: val?.StudentPlan?.Subscription?.plan_name,
      add_ons: val?.StudentPlan?.addon?.map((ele) => ele?.Add_on?.plan_name),
      discount: val?.StudentPlan?.Discount?.discount_name || "",
    }));

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Student Report.",
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

//export to excel functionalities...

exports.paymentReportexporttoExcelFunction = async function (req, res) {
  try {
    let searchCondition = {};
    let whereCondition = {
      status: "paid",
    };

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
            db.Sequelize.fn("YEAR", db.Sequelize.col("collected_date")),
            year
          ),
          db.Sequelize.where(
            db.Sequelize.fn("MONTH", db.Sequelize.col("collected_date")),
            month
          ),
        ],
      };
    }

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
      order: [["due_date", "DESC"]],
    });

    let formattedArr = [];

    feeData?.rows?.forEach((element) => {
      let formattedData = {};

      let addons = [];
      if (element?.StudentPlan?.addon.length) {
        for (let val of element?.StudentPlan?.addon) {
          addons.push(val?.Add_on?.plan_name);
        }
      }

      formattedData = {
        id: element?.id,
        student_id: element?.student_id,
        student_name:
          element?.Student?.first_name + " " + element?.Student?.last_name,
        profile_pic: element?.Student?.profile_pic,
        plan_name: element?.StudentPlan?.Subscription?.plan_name,
        addons: addons,
        payment_date: element?.collected_date,
        paid_amount: element?.paid_amount,
        payment_method: element?.payment_method,
      };

      formattedArr.push(formattedData);
    });

    //--------------------------------------------------------------
    //Excel convertion

    const worksheetData = formattedArr.map((record, index) => {
      const dynamicRecord = { sl: index + 1 };

      Object.keys(record).forEach((key) => {
        if (key !== "id" && key !== "profile_pic") {
          const value = record?.[key];
          dynamicRecord[key] = Array.isArray(value) ? value.join(", ") : value;
        }
      });

      return dynamicRecord;
    });

    const headers = [
      "Sl",
      "Student ID",
      "Name",
      "Product Plan",
      "Add On",
      "Payment Date",
      "Amount Paid",
      "Payment Mode",
    ];

    const cellWidth = [
      { wch: 5 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];

    let heading = "PAYMENT REPORT";

    let headingCell = "D1";

    await exportToExcel(
      res,
      worksheetData,
      heading,
      headers,
      cellWidth,
      headingCell
    );
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

exports.arrearReportexporttoExcelFunction = async function (req, res) {
  try {
    let searchCondition = {};
    let whereCondition = {
      status: "overdue",
    };

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
              model: Subscription,
              attributes: { exclude: ["createdAt", "updatedAt"] },
            },
          ],
        },
      ],
      order: [["due_date", "DESC"]],
    });

    const lastPaidData = await Fee_Management.findAll({
      where: {
        status: "paid",
      },
      attributes: [
        "student_id",
        [db.Sequelize.fn("MAX", db.Sequelize.col("due_date")), "due_date"],
      ],
      group: ["student_id"],
      raw: true,
    });

    let formattedArr = [];

    feeData?.rows?.forEach((element) => {
      let formattedData = {};

      formattedData = {
        id: element?.id,
        student_id: element?.student_id,
        student_name:
          element?.Student?.first_name + " " + element?.Student?.last_name,
        profile_pic: element?.Student?.profile_pic,
        plan_name: element?.StudentPlan?.Subscription?.plan_name,
        due_amount: element?.total_amount,
        last_paid_amount:
          lastPaidData?.find((val) => val.student_id == element?.student_id)
            ?.due_date || "",
        due_date: element?.due_date,
      };

      formattedArr.push(formattedData);
    });
    //--------------------------------------------------------------
    //Excel convertion

    const worksheetData = formattedArr.map((record, index) => {
      const dynamicRecord = {};

      Object.keys(record).forEach((key) => {
        if (key !== "id" && key !== "profile_pic" && key !== "due_date") {
          const value = record?.[key];
          dynamicRecord[key] = Array.isArray(value) ? value.join(", ") : value;
        }
      });

      return dynamicRecord;
    });

    const headers = [
      "Student ID",
      "Name",
      "Product Plan",
      "Amount Due",
      "Last Payment Date",
    ];

    const cellWidth = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];

    let heading = "ARREARS REPORT";

    let headingCell = "C1";

    await exportToExcel(
      res,
      worksheetData,
      heading,
      headers,
      cellWidth,
      headingCell
    );
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

exports.studentReportexporttoExcelFunction = async function (req, res) {
  try {
    let searchCondition = {};
    let whereCondition = {};

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
            db.Sequelize.fn("YEAR", db.Sequelize.col("start_date")),
            year
          ),
          db.Sequelize.where(
            db.Sequelize.fn("MONTH", db.Sequelize.col("start_date")),
            month
          ),
        ],
      };
    }

    let { filter } = req.body;

    // if (filter.plan) {
    //   whereCondition = {
    //     ...whereCondition,
    //     [Op.or]: [
    //       {
    //         "$StudentPlan.Subscription.plan_name$": { [Op.in]: [filter.plan] },
    //       },
    //     ],
    //   };
    // }

    const studentData = await Student.findAndCountAll({
      distinct: true,
      where: searchCondition,
      attributes: ["id", "first_name", "last_name", "profile_pic"],
      include: [
        {
          model: StudentPlan,
          where: whereCondition,
          attributes: ["plan_id", "discount_id", "start_date"],
          include: [
            {
              model: Subscription,
              attributes: ["plan_name"],
            },
            {
              model: StudentAddon,
              as: "addon",
              attributes: ["id"],
              include: [
                {
                  model: AddOn,
                  attributes: ["plan_name"],
                },
              ],
            },
            {
              model: Discount,
              attributes: ["discount_name"],
            },
          ],
        },
      ],
      order: [["first_name", "ASC"]],
    });

    const formattedData = studentData.rows.map((val) => ({
      student_id: val?.id,
      student_name: val?.first_name + " " + val?.last_name,
      plan_name: val?.StudentPlan?.Subscription?.plan_name,
      add_ons: val?.StudentPlan?.addon?.map((ele) => ele?.Add_on?.plan_name),
      discount: val?.StudentPlan?.Discount?.discount_name || "",
    }));

    //----------------------------------
    //Excel convertion

    const worksheetData = formattedData.map((record, index) => {
      const dynamicRecord = {};

      Object.keys(record).forEach((key) => {
        if (key !== "id" && key !== "profile_pic") {
          const value = record?.[key];
          dynamicRecord[key] = Array.isArray(value) ? value.join(", ") : value;
        }
      });

      return dynamicRecord;
    });

    const headers = ["Student ID", "Name", "Package", "Add On", "Discount"];

    const cellWidth = [
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];

    let heading = "STUDENTS REPORT";

    let headingCell = "C1";

    await exportToExcel(
      res,
      worksheetData,
      heading,
      headers,
      cellWidth,
      headingCell
    );
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

const exportToExcel = async (
  res,
  worksheetData,
  title,
  tableHeader,
  cellWidth,
  headingCell
) => {
  try {
    const workbook = xlsx.utils.book_new();

    const worksheet = xlsx.utils.json_to_sheet([]);

    const heading = [[title]];
    xlsx.utils.sheet_add_aoa(worksheet, heading, { origin: headingCell });

    const headers = [tableHeader];

    xlsx.utils.sheet_add_aoa(worksheet, headers, { origin: "A3" });

    xlsx.utils.sheet_add_json(worksheet, worksheetData, {
      skipHeader: true,
      origin: "A4",
    });

    worksheet["!cols"] = cellWidth;

    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = xlsx.write(workbook, {
      bookType: "xlsx",
      type: "base64",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=data.xlsx");

    res.send(excelBuffer);
  } catch (error) {
    console.log(error);
  }
};

async function calculatePercentage(currentMonthCount, previousMonthCount) {
  let percentageChange = 0;
  if (previousMonthCount > 0) {
    percentageChange =
      ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100;
  } else if (currentMonthCount > 0) {
    percentageChange = 100;
  }

  return percentageChange;
}
