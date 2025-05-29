const db = require("../../models");
const config = require("../../config/constants.js");
const moment = require("moment/moment.js");
const { Op, fn, col } = require("sequelize");

const Student = db.Student;
const StudentPlan = db.StudentPlan;
const Fee_Management = db.Fee_Management;
const Subscription = db.Subscription;
const StudentAddon = db.StudentAddon;
const AddOn = db.AddOn;
const SubscriptionDays = db.SubscriptionDays;

exports.dashboardCountData = async function (req, res) {
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

    //-------------------------------------------------------

    const arrearPrecentage = await calculatePercentage(
      arrearsCurrentMonth,
      arrearsPrevMonth
    );

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Dashboard Counts",
        data: {
          total_student_count: {
            count: studentCount,
            percentage: studentPercentage,
          },
          pending_arrers_count: {
            count: pendingArrearsCount,
            percentage: arrearPrecentage,
          },
          active_count: { count: 0, percentage: 0 },
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

exports.getmonthlyFeeDataAndOverDue = async function (req, res) {
  try {
    //monthly report
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentYear, currentMonth, 0);

    const monthlyFeeData = await Fee_Management.findAll({
      attributes: [
        [db.Sequelize.fn("YEAR", db.Sequelize.col("due_date")), "year"],
        [db.Sequelize.fn("MONTH", db.Sequelize.col("due_date")), "month"],
        "status",
        [db.Sequelize.fn("COUNT", db.Sequelize.col("status")), "count"],
      ],
      where: {
        due_date: {
          [Op.between]: [startDate, endDate],
        },
      },
      group: [
        db.Sequelize.fn("YEAR", db.Sequelize.col("due_date")),
        db.Sequelize.fn("MONTH", db.Sequelize.col("due_date")),
        "status",
      ],
      order: [
        [db.Sequelize.fn("YEAR", db.Sequelize.col("due_date")), "ASC"],
        [db.Sequelize.fn("MONTH", db.Sequelize.col("due_date")), "ASC"],
      ],
    });

    const formattedData = monthlyFeeData.reduce((acc, item) => {
      const year = item.getDataValue("year");
      const month = item.getDataValue("month");
      const status = item.getDataValue("status");
      const count = item.getDataValue("count");

      let monthData = acc.find((data) => data.month == month);
      if (!monthData) {
        monthData = { year, month, paid: 0, overdue: 0 };
        acc.push(monthData);
      }

      if (status === "paid") {
        monthData.paid = count;
      } else if (status === "overdue") {
        monthData.overdue = count;
      }

      return acc;
    }, []);

    //----------------------------------------------------
    //monthly report %
    const thisMonth = moment().month() + 1; // Feb = 2
    const thisYear = moment().year();

    const previousMonth = thisMonth === 1 ? 12 : thisMonth - 1; // Jan if current is Feb
    const previousYear = thisMonth === 1 ? thisYear - 1 : thisYear;

    const totalCurrentMonth = await Fee_Management.sum("total_amount", {
      where: {
        status: { [Op.in]: ["paid"] },
        due_date: {
          [Op.gte]: new Date(`${thisYear}-${thisMonth}-01`),
          [Op.lt]: new Date(`${thisYear}-${thisMonth + 1}-01`),
        },
      },
    });

    // Get total for the previous month
    const totalPreviousMonth = await Fee_Management.sum("total_amount", {
      where: {
        status: { [Op.in]: ["paid"] },
        due_date: {
          [Op.gte]: new Date(`${previousYear}-${previousMonth}-01`),
          [Op.lt]: new Date(`${previousYear}-${previousMonth + 1}-01`),
        },
      },
    });

    const precentageOffee = await calculatePercentage(
      totalCurrentMonth,
      totalPreviousMonth
    );

    //----------------------------------------------------
    //overdue student list

    const offset = 1;
    const limit = 5;

    const overdueStduentlist = await Fee_Management.findAll({
      where: {
        status: { [Op.in]: ["overdue"] },
      },
      attributes: ["id", "due_date", "total_amount"],
      include: [
        {
          model: Student,
          attributes: ["first_name", "last_name", "profile_pic"],
        },
      ],
      order: [["id", "DESC"]],
      offset,
      limit,
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Monthly report and Overdue list",
        data: {
          monthly_report: formattedData,
          overdue_list: overdueStduentlist,
          precentage_of_fee: precentageOffee.toFixed(2),
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

exports.subscriptionPieChartData = async function (req, res) {
  try {
    const activeStudentCount = await Student.count({});

    const paymentDueCount = await Fee_Management.count({
      where: {
        status: { [Op.in]: ["overdue"] },
        due_date: {
          [Op.between]: [
            moment().startOf("month").toDate(),
            moment().endOf("month").toDate(),
          ],
        },
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Subscription Data",
        data: {
          active_student: activeStudentCount,
          inactive_student: 0,
          payment_due: paymentDueCount,
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
