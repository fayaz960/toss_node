const db = require("../../models/index.js");
const config = require("../../config/constants.js");
const { Op, json } = require("sequelize");
const Sync = db.Sync;
const Student = db.Student;
const Attendance = db.Attendance;

exports.syncAttendance = async function (req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Data missing." });
    }

    let punchData = req.body;

    const addOnData = {
      data: JSON.stringify(req.body),
      status: 0,
    };

    const syncData = await Sync.create(addOnData);

    for (let punch of punchData?.punch_data) {
      let isStudentExisit = await Student.findOne({
        where: {
          punc_number: { [Op.in]: [punch?.trans_card_no] },
        },
      });

      if (isStudentExisit) {
        const isDuplicate = await Attendance.findOne({
          where: {
            student_id: isStudentExisit?.id,
            punch_datetime: punch?.punch_datetime,
          },
        });

        if (!isDuplicate) {
          const attendanceData = {
            student_id: isStudentExisit?.id,
            punch_no: punch?.trans_card_no,
            punch_datetime: punch?.punch_datetime,
          };

          await Attendance.create(attendanceData);
        }
      }
    }

    const updatesync = {
      status: 1,
    };

    await Sync.update(updatesync, {
      where: {
        id: syncData.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      data: {
        message: "Attendance synched Successfully.",
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

exports.syncAllatOnce = async function (req, res) {
  try {
    const syncedData = await Sync.findAll({
      // where: {
      //   id: { [Op.in]: [3] },
      // },
    });

    for (let val of syncedData) {
      let parseData = JSON.parse(val.dataValues.data);

      // console.log(parseData);

      if (parseData && parseData?.punch_data?.length > 0) {
        for (let punch of parseData.punch_data) {
          let isStudentExisit = await Student.findOne({
            where: {
              punc_number: { [Op.in]: [punch?.trans_card_no] },
            },
          });
          if (isStudentExisit) {
            const isDuplicate = await Attendance.findOne({
              where: {
                student_id: isStudentExisit?.id,
                punch_datetime: punch?.punch_datetime,
              },
            });

            if (!isDuplicate) {
              const attendanceData = {
                student_id: isStudentExisit?.id,
                punch_no: punch?.trans_card_no,
                punch_datetime: punch?.punch_datetime,
              };

              await Attendance.create(attendanceData);
            }
          }
          // const updatesync = {
          //   status: 1,
          // };
          // await Sync.update(updatesync, {
          //   where: {
          //     id: val.id,
          //   },
          // });
        }
      }
    }

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Attendance synched Successfully.",
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
