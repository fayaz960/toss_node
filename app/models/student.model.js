//Student Model
module.exports = (sequelize, Sequelize) => {
  const Student = sequelize.define(
    "Student",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      dob: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM("male", "female"),
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      profile_pic: {
        type: Sequelize.STRING(220),
        allowNull: true,
      },
      id_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(12),
        allowNull: false,
      },
      punc_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      street_number: {
        type: Sequelize.STRING(350),
        allowNull: false,
      },
      place: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      pin_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      country: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
    },
    {
      modelName: "Student",
      tableName: "toss_students",
      timestamps: true,
    }
  );
  return Student;
};
