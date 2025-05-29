// Attendance.model.js
module.exports = (sequelize, Sequelize) => {
  const Attendance = sequelize.define(
    "Attendance",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      student_id: {
        type: Sequelize.INTEGER,
      },
      punch_no: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      punch_datetime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      synched_on: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
    },
    {
      modelName: "Attendance",
      tableName: "toss_attendance",
      timestamps: false,
    }
  );

  return Attendance;
};
