const db = require("../../models");
const config = require("../../config/constants.js");
const { Op, where } = require("sequelize");
const moment = require("moment");

const Student = db.Student;
const Subscription = db.Subscription;
const AddOn = db.AddOn;
const Discount = db.Discount;
const StudentPlan = db.StudentPlan;
const StudentAddon = db.StudentAddon;
const SubscriptionDays = db.SubscriptionDays;
const Country = db.Country;

exports.getsubscriptionPlans = async function (req, res) {
  try {
    let dropdownData;
    let message;

    if (req.body.type == 1) {
      const planData = await Subscription.findAll({
        attributes: ["id", "plan_name"],
        order: [["id", "DESC"]],
      });

      dropdownData = planData;
      message = "Subscription Plan List.";
    }

    if (req.body.type == 2) {
      const AddonData = await AddOn.findAll({
        attributes: ["id", "plan_name"],
        order: [["id", "DESC"]],
      });

      dropdownData = AddonData;
      message = "Add On List.";
    }

    if (req.body.type == 3) {
      const AddonData = await Discount.findAll({
        where: {
          status: { [Op.in]: ["1"] },
        },
        attributes: ["id", "discount_name"],
        order: [["id", "DESC"]],
      });

      dropdownData = AddonData;
      message = "Discount List.";
    }

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: message,
        data: dropdownData,
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

exports.getCountryList = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount;
    const limit = pageCount;

    let whereCondition = {};

    if (req.body.searchKey) {
      whereCondition.name = { [Op.like]: [`%${req.body.searchKey}%`] };
    }

    const countryData = await Country.findAndCountAll({
      where: whereCondition,
      order: [["name", "ASC"]],
      offset,
      limit,
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Country List",
        count: countryData.count,
        data: countryData.rows,
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

exports.addStudentsFunction = async function (req, res) {
  try {
    const isExisit = await Student.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (isExisit) {
      return res.status(config.HTTP_STATUS.EXIST.code).send({
        status: config.HTTP_STATUS.EXIST,
        response: {
          message: "Student Already Exist",
        },
      });
    }

    const studentData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      gender: req.body.gender,
      dob: req.body.dob,
      age: req.body.age,
      id_number: req.body.id_no,
      email: req.body.email,
      phone: req.body.phone_number,
      punc_number: req.body.punch_no,
      street_number: req.body.street_name,
      place: req.body.place,
      city: req.body.city,
      pin_code: req.body.pincode,
      state: req.body.state,
      country: req.body.country,
      created_by: req.body.created_by,
      profile_pic: req.body.profile_pic,
    };

    const newStudent = await Student.create(studentData);

    const planDetails = await Subscription.findOne({
      where: {
        id: req.body.plan_id,
      },
    });

    let total_addon = 0;

    if (req.body.add_ons.length) {
      let addons = req.body.add_ons;

      for (let val of addons) {
        const addOnsDetails = await AddOn.findOne({
          where: {
            id: val,
          },
        });

        total_addon = total_addon += addOnsDetails.plan_charge;
      }
    }

    let discountAmount = 0;

    if (req.body.is_discount) {
      const discountDetails = await Discount.findOne({
        where: {
          id: req.body.discount_id,
        },
      });

      discountAmount = await findDiscountAmount(
        planDetails.plan_charge,
        total_addon,
        discountDetails.dataValues
      );
    }

    const studentPlanData = {
      student_id: newStudent.id,
      plan_id: req.body.plan_id,
      // start_date: moment(Date.now()).format("YYYY-MM-DD"),
      start_date: req.body.joining_date,
      is_discount: req.body.is_discount ? "yes" : "no",
      discount_id: (req.body.is_discount && req.body.discount_id) || null,
      discount_amount: discountAmount,
      plan_amount: planDetails.plan_charge,
      add_on_amount: total_addon,
      total_amount: planDetails.plan_charge + total_addon - discountAmount,
    };
    // console.log(studentPlanData);

    const newStudentPlan = await StudentPlan.create(studentPlanData);

    if (req.body.add_ons.length) {
      let addons = req.body.add_ons;

      for (let val of addons) {
        const studentAddOnData = {
          student_id: newStudent.id,
          student_plan_id: newStudentPlan.id,
          plan_id: req.body.plan_id,
          add_on_id: val,
        };

        await StudentAddon.create(studentAddOnData);
      }
    }

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Student Added Successfully.",
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

function findDiscountAmount(plan_amount, add_on_amount, discountDetails) {
  let discount = discountDetails.rate;
  let total_amount = plan_amount + add_on_amount;
  let discountAmount = 0;

  if (discountDetails.discount_type == "percentage") {
    discountAmount = total_amount * (discount / 100);
  } else {
    discountAmount = discount;
  }

  return discountAmount;
}

exports.getStudentDetails = async function (req, res) {
  try {
    const page = req.body.page;
    const pageCount = req.body.pageCount;

    const offset = (page - 1) * pageCount || 0;
    const limit = pageCount || 10;

    let whereCondition = {};

    if (req.body.searchKey) {
      const searchWords = req.body.searchKey.split(" ");

      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          { first_name: { [Op.like]: `%${req.body.searchKey}%` } },
          { last_name: { [Op.like]: `%${req.body.searchKey}%` } },
          {
            [Op.and]: searchWords.map((word) => ({
              [Op.or]: [
                { first_name: { [Op.like]: `%${word}%` } },
                { last_name: { [Op.like]: `%${word}%` } },
              ],
            })),
          },
        ],
      };
    }

    let filter = req.body.filter;

    if (filter.plan) {
      whereCondition = {
        ...whereCondition,
        [Op.or]: [
          {
            "$StudentPlan.Subscription.plan_name$": {
              [Op.like]: `%${filter.plan}%`,
            },
          },
        ],
      };
    }

    // if (filter.add_on) {
    //   whereCondition = {
    //     ...whereCondition,
    //     [Op.or]: [
    //       {
    //         "$StudentPlan.StudentAddon.AddOn.plan_name$": {
    //           [Op.like]: `%${filter.add_on}%`,
    //         },
    //       },
    //     ],
    //   };
    // }

    const studentsDetails = await Student.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: StudentPlan,
          attributes: { exclude: ["createdAt", "updatedAt"] },
          include: [
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
          ],
        },
      ],
      attributes: { exclude: ["createdAt", "updatedAt"] },
      order: [["id", "DESC"]],
      distinct: true,
      offset,
      limit,
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Student List.",
        count: studentsDetails.count,
        data: studentsDetails.rows,
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

exports.updateStudentDetails = async function (req, res) {
  try {
    const studentData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      gender: req.body.gender,
      dob: req.body.dob,
      age: req.body.age,
      id_number: req.body.id_no,
      email: req.body.email,
      phone: req.body.phone_number,
      punc_number: req.body.punch_no,
      street_number: req.body.street_name,
      place: req.body.place,
      city: req.body.city,
      pin_code: req.body.pincode,
      state: req.body.state,
      country: req.body.country,
      created_by: req.body.created_by,
      profile_pic: req.body.profile_pic,
    };

    const newStudent = await Student.update(studentData, {
      where: {
        id: req.body.id,
      },
    });

    const planDetails = await Subscription.findOne({
      where: {
        id: req.body.plan_id,
      },
    });

    let total_addon = 0;

    if (req.body.add_ons.length) {
      let addons = req.body.add_ons;

      for (let val of addons) {
        const addOnsDetails = await AddOn.findOne({
          where: {
            id: val,
          },
        });

        total_addon = total_addon += addOnsDetails.plan_charge;
      }
    }

    let discountAmount = 0;

    if (req.body.is_discount) {
      const discountDetails = await Discount.findOne({
        where: {
          id: req.body.discount_id,
        },
      });

      discountAmount = await findDiscountAmount(
        planDetails.plan_charge,
        total_addon,
        discountDetails.dataValues
      );
    }

    const studentPlanData = {
      plan_id: req.body.plan_id,
      is_discount: req.body.is_discount ? "yes" : "no",
      discount_id: (req.body.is_discount && req.body.discount_id) || null,
      discount_amount: discountAmount,
      plan_amount: planDetails.plan_charge,
      add_on_amount: total_addon,
      total_amount: planDetails.plan_charge + total_addon - discountAmount,
      start_date: req.body.joining_date,
    };

    await StudentPlan.update(studentPlanData, {
      where: {
        student_id: req.body.id,
      },
    });

    if (req.body.add_ons.length) {
      let addons = req.body.add_ons;

      const updatedPlan = await StudentPlan.findOne({
        where: {
          student_id: req.body.id,
        },
      });

      await StudentAddon.destroy({
        where: {
          student_id: req.body.id,
        },
      });

      for (let val of addons) {
        const studentAddOnData = {
          student_id: req.body.id,
          student_plan_id: updatedPlan.id,
          plan_id: req.body.plan_id,
          add_on_id: val,
        };

        await StudentAddon.create(studentAddOnData);
      }
    } else {
      await StudentAddon.destroy({
        where: {
          student_id: req.body.id,
        },
      });
    }

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Student Updated Successfully.",
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

exports.deleteStudentData = async function (req, res) {
  try {
    const isExisit = await Student.findOne({
      where: {
        id: req.body.id,
      },
    });

    if (!isExisit) {
      res.status(config.HTTP_STATUS.NOT_FOUND.code).send({
        status: config.HTTP_STATUS.NOT_FOUND,
        response: {
          message: "Student Not Found.",
        },
      });
    }

    await StudentAddon.destroy({
      where: {
        student_id: req.body.id,
      },
    });

    await StudentPlan.destroy({
      where: {
        student_id: req.body.id,
      },
    });

    await Student.destroy({
      where: {
        id: req.body.id,
      },
    });

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Student Deleted Successfully.",
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

exports.savestudentImage = async function (req, res) {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
    }

    const fileName = req.file.filename;

    res.status(config.HTTP_STATUS.SUCCESS.code).send({
      status: config.HTTP_STATUS.SUCCESS,
      response: {
        message: "Student image uploaded successfully.",
        file_name: fileName,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(config.HTTP_STATUS.INTERNAL_SERVER.code).send({
      status: config.HTTP_STATUS.INTERNAL_SERVER,
      response: {
        message: error.message,
      },
    });
  }
};
