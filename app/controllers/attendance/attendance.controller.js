const db = require("../../models");
const config = require("../../config/constants.js");
const { Op, fn, col, where, literal } = require("sequelize");
const moment = require("moment/moment.js");

const Subscription = db.Subscription;
const SubscriptionDays = db.SubscriptionDays;
const Student = db.Student;
const StudentPlan = db.StudentPlan;
const Attendance = db.Attendance;

exports.attendanceDashBoardcount = async function (req, res) {
  try {
    // const today = new Date();
    // const formattedDate = today.toISOString().split("T")[0];

    const todayStart = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss");
    const todayEnd = moment().endOf("day").format("YYYY-MM-DD HH:mm:ss");

    const totalStudentCount = await Student.count({
      where: {
        status: { [Op.in]: [1] },
      },
    });

    //--------------------

    const todayAttendance = await Attendance.count({
      distinct: true,
      col: "student_id",
      where: {
        punch_datetime: {
          [Op.between]: [todayStart, todayEnd],
        },
      },
    });

    const todayAbsentees = totalStudentCount - todayAttendance;

    //-------------------

    const cutoffDate = moment()
      .subtract(15, "days")
      .startOf("day")
      .format("YYYY-MM-DD HH:mm:ss");

    const activeUsers = await Attendance.findAll({
      attributes: ["punch_no"],
      where: {
        punch_datetime: { [Op.gte]: cutoffDate },
      },
      group: ["punch_no"],
    });

    const activeUserIds = activeUsers.map((user) => user.punch_no);

    const inactiveUserCount = await Student.count({
      distinct: true,
      col: "punc_number",
      where: {
        punc_number: { [Op.notIn]: activeUserIds },
      },
    });

    //-----------------------------------------

    const from_date = new Date(req.body.from_date);
    const to_date = new Date(req.body.to_date);

    const start_date = new Date(
      Date.UTC(
        from_date.getFullYear(),
        from_date.getMonth(),
        from_date.getDate(),
        0,
        0,
        0,
        0
      )
    );

    const end_date = new Date(
      Date.UTC(
        to_date.getFullYear(),
        to_date.getMonth(),
        to_date.getDate(),
        23,
        59,
        59,
        999
      )
    );

    let startDate = start_date.toISOString();
    let endDate = end_date.toISOString();

    const totalStudents = await Student.findAll();

    const punchDetails = await Attendance.findAll({
      where: {
        punch_datetime: {
          [Op.between]: [startDate, endDate],
        },
      },
      // attributes: ["student_id", "punch_datetime"],
      raw: true,
    });

    const studentPunchMap = {};

    punchDetails.forEach((punch) => {
      const punchDate = moment(punch.punch_datetime).format("YYYY-MM-DD");
      if (!studentPunchMap[punchDate]) studentPunchMap[punchDate] = {};
      if (!studentPunchMap[punchDate][punch.student_id]) {
        studentPunchMap[punchDate][punch.student_id] = [];
      }
      studentPunchMap[punchDate][punch.student_id].push(
        new Date(punch.punch_datetime)
      );
    });

    const dailyAttendance = [];

    for (
      let d = new Date(startDate);
      d <= new Date(endDate);
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];

      const formattedStudentList = totalStudents.map((student) => {
        const attendanceRecords = studentPunchMap[dateStr]?.[student.id] || [];

        let punch_in = null;
        let punch_out = null;

        if (attendanceRecords.length === 1) {
          punch_in = attendanceRecords[0];
        } else if (attendanceRecords.length > 1) {
          punch_in = new Date(Math.min(...attendanceRecords));
          punch_out = new Date(Math.max(...attendanceRecords));
        }

        return {
          id: student.id,
          punch_number: student.punc_number,
          entry_time: punch_in,
          exit_time: punch_out,
          status:
            attendanceRecords.length === 0
              ? "Absent"
              : attendanceRecords.length > 1
              ? "Present"
              : "Miss Punch",
        };
      });

      dailyAttendance.push({ date: dateStr, attendance: formattedStudentList });
    }

    let presentCount = 0;
    let absentCount = 0;
    let missPunchCount = 0;

    dailyAttendance.forEach((day) => {
      day.attendance.forEach((record) => {
        if (record.status === "Present") presentCount++;
        else if (record.status === "Absent") absentCount++;
        else if (record.status === "Miss Punch") missPunchCount++;
      });
    });

    let result = {
      presentCount,
      absentCount,
      missPunchCount,
    };

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Count data.",
        data: {
          total_student_count: totalStudentCount,
          today_attendance: todayAttendance,
          today_absentees: todayAbsentees,
          long_absentees: inactiveUserCount,
          graphData: result,
        },
      },
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

// exports.getStudentforPlans = async function (req, res) {
//   try {
//     const { id, date, page = 1, pageCount = 10 } = req.body;

//     const offset = (page - 1) * pageCount;
//     const limit = pageCount;

//     const selectedDate = date ? new Date(date) : new Date();
//     const formattedDate = selectedDate.toISOString().split("T")[0];

//     const studentList = await Student.findAndCountAll({
//       distinct: true,
//       subQuery: false, // Prevents Sequelize from miscounting when using includes
//       attributes: ["first_name", "last_name", "profile_pic", "punc_number"],
//       include: [
//         {
//           model: StudentPlan,
//           where: { plan_id: req.body.id },
//           attributes: ["plan_id"],
//           include: [
//             {
//               model: Subscription,
//               attributes: ["plan_name"],
//             },
//           ],
//         },
//         {
//           model: Attendance,
//           attributes: [
//             [fn("MIN", col("punch_datetime")), "punch_in"],
//             [fn("MAX", col("punch_datetime")), "punch_out"],
//           ],
//           where: {
//             punch_datetime: {
//               [Op.between]: [
//                 `${formattedDate} 00:00:00`,
//                 `${formattedDate} 23:59:59`,
//               ],
//             },
//           },
//           required: false, // Ensures students without attendance data are included
//         },
//       ],
//       order: [["first_name", "ASC"]],
//       offset,
//       limit,
//     });

//     const formattedData = studentList?.rows?.map((data) => {
//       const attendance =
//         data?.Attendances?.length > 0 ? data?.Attendances?.[0] : {};
//       const punchCount = attendance?.dataValues?.punch_count || 0;

//       return {
//         student_name: `${data?.first_name} ${data?.last_name}`,
//         profile_pic: data?.profile_pic,
//         punc_number: data?.punc_number,
//         plan_name: data?.StudentPlan?.Subscription?.plan_name,
//         entry_time: punchCount > 0 ? attendance?.dataValues?.punch_in : "",
//         exit_time: punchCount > 1 ? attendance?.dataValues?.punch_out : "",
//         status:
//           punchCount == 0
//             ? "Absent"
//             : punchCount > 1
//             ? "Present"
//             : "Miss Punch",
//       };
//     });

//     res.status(config.HTTP_STATUS.SUCCESS.code).send({
//       status: config.HTTP_STATUS.SUCCESS,
//       response: {
//         message: "Subscribed Student List.",
//         count: studentList.count,
//         data: formattedData,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
//       status: config.HTTP_STATUS.INTERNAL_SERVER,
//       response: {
//         message: error.message || "Internal Server Error",
//       },
//     });
//   }
// };

exports.getStudentforPlans = async function (req, res) {
  try {
    const { page = 1, pageCount = 10 } = req.body;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let today = new Date();
    let date = new Date(req.body.date);

    const selectedDate = !isNaN(date.getTime())
      ? new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
      : new Date(
          Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
        );

    console.log(selectedDate, "_____________________");

    const formattedDate = selectedDate.toISOString().split("T")[0];

    console.log(formattedDate, "--------------------");

    let searchCondition = {};

    if (req.body.searchKey) {
      searchCondition = {
        ...searchCondition,
        first_name: { [Op.like]: `%${req.body.searchKey}%` },
      };
    }

    const subscriptionData = await Subscription.findOne({
      where: {
        id: req.body.id,
      },
      attributes: ["plan_name", "from_time", "to_time"],
      include: [
        {
          model: SubscriptionDays,
          attributes: ["day"],
        },
      ],
    });

    const studentCountData = await StudentPlan.count({
      where: {
        plan_id: req.body.id,
      },
    });

    const studentList = await StudentPlan.findAndCountAll({
      where: {
        plan_id: req.body.id,
      },
      attributes: ["id", "plan_id"],
      include: [
        {
          model: Student,
          where: searchCondition,
          attributes: ["first_name", "last_name", "profile_pic", "punc_number"],
          required: true,
          include: [
            {
              model: Attendance,
              // attributes: [
              //   [fn("MIN", col("punch_datetime")), "punch_in"],
              //   [fn("MAX", col("punch_datetime")), "punch_out"],
              // ],
              attributes: ["punch_datetime"],
              where: {
                punch_datetime: {
                  [Op.between]: [
                    `${formattedDate} 00:00:00`,
                    `${formattedDate} 23:59:59`,
                  ],
                },
              },
              required: false,
            },
          ],
        },
        {
          model: Subscription,
          attributes: ["plan_name"],
        },
      ],
    });

    const formattedStudentList = studentList.rows.map((student) => {
      const attendanceRecords = student.Student.Attendances.map(
        (a) => new Date(a.punch_datetime)
      );

      let punch_in = null;
      let punch_out = null;

      if (attendanceRecords.length === 1) {
        punch_in = attendanceRecords[0];
      } else if (attendanceRecords.length > 1) {
        punch_in = new Date(Math.min(...attendanceRecords));
        punch_out = new Date(Math.max(...attendanceRecords));
      }

      return {
        id: student.id,
        plan_id: student.plan_id,
        plan_name: student.Subscription.plan_name,
        student_name:
          student.Student.first_name + " " + student.Student.last_name,
        profile_pic: student.Student.profile_pic,
        punc_number: student.Student.punc_number,
        entry_time: punch_in,
        exit_time: punch_out,
        status:
          attendanceRecords.length == 0
            ? "Absent"
            : attendanceRecords.length > 1
            ? "Present"
            : "Miss Punch",
      };
    });

    let result = {
      plan_name: subscriptionData.plan_name,
      from_time: subscriptionData.from_time,
      to_time: subscriptionData.to_time,
      subscription_days: subscriptionData.Subscription_Days,
      student_count: studentCountData,
      students: formattedStudentList,
    };

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Subscribed Student List.",
        count: studentList.count,
        data: result,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
      status: config.HTTP_STATUS.INTERNAL_SERVER,
      response: {
        message: error.message || "Internal Server Error",
      },
    });
  }
};

exports.getActiveMembers = async function (req, res) {
  try {
    let today = new Date();
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    let page = parseInt(req.body.page) || 1;
    let limit = parseInt(req.body.pageCount) || 10;
    let offset = (page - 1) * limit;

    // const totalActiveCount = await Attendance.count({
    //   col: "student_id",
    //   distinct: true,
    //   where: {
    //     punch_datetime: { [Op.gte]: last30Days },
    //   },
    // });

    const activeStudents = await Attendance.findAll({
      attributes: [
        "student_id",
        [
          fn("COUNT", fn("DISTINCT", literal("DATE(punch_datetime)"))),
          "active_days",
        ],
        [fn("MAX", col("punch_datetime")), "last_active_date"],
      ],
      include: [
        {
          model: Student,
          attributes: ["first_name", "last_name", "profile_pic"],
        },
      ],
      where: {
        punch_datetime: { [Op.gte]: last30Days },
      },
      group: ["student_id", "Student.id"],
      limit,
      offset,
      raw: true,
      nest: true,
    });

    const activeStudentsWithInactiveDays = activeStudents.map((student) => {
      const lastActiveDate = new Date(student.last_active_date);
      const inactiveDays = Math.floor(
        (today - lastActiveDate) / (1000 * 60 * 60 * 24)
      );

      return {
        id: student.student_id,
        first_name: student.Student.first_name,
        last_name: student.Student.last_name,
        inactive_days: inactiveDays,
        profile_pic: student.Student.profile_pic,
      };
    });

    //-----------------------------------------------------

    const absentTime = moment()
      .subtract(15, "days")
      .format("YYYY-MM-DD HH:mm:ss");

    const absentees = await Student.findAll({
      attributes: [
        "id",
        "first_name",
        "last_name",
        "profile_pic",
        [
          db.Sequelize.literal(`(
                    SELECT MAX(punch_datetime) 
                    FROM toss_attendance 
                    WHERE student_id = Student.id
                )`),
          "last_punch_date",
        ],
      ],
      include: [
        {
          model: StudentPlan,
          attributes: ["start_date"],
        },
      ],
      where: {
        id: {
          [Op.notIn]: db.Sequelize.literal(`(
                    SELECT student_id FROM toss_attendance
                    WHERE punch_datetime >= '${absentTime}'
                )`),
        },
      },
      limit,
      offset,
    });

    const formattedAbsenteeData = absentees.map((data) => {
      const today = new Date();
      let referenceDate = data.dataValues.last_punch_date
        ? new Date(data.dataValues.last_punch_date)
        : new Date(data.dataValues.StudentPlan.start_date);

      const diffTime = Math.abs(today - referenceDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        profile_pic: data.profile_pic,
        inactive_days: diffDays,
      };
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "List",
        data: {
          active_students: activeStudentsWithInactiveDays,
          in_active_students: formattedAbsenteeData,
        },
      },
    });
  } catch (error) {
    console.log(error);
    res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
      status: config.HTTP_STATUS.INTERNAL_SERVER,
      response: {
        message: error.message || "Internal Server Error",
      },
    });
  }
};
