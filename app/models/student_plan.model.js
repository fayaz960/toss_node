//StudentPlan Model
module.exports = (sequelize, Sequelize) => {
  const StudentPlan = sequelize.define(
    "StudentPlan",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      student_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      plan_id: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_discount: {
        type: Sequelize.ENUM("yes", "no"),
        defaultValue: "no",
      },
      discount_id: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
      },
      discount_amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      plan_amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      add_on_amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      is_discount: {
        type: Sequelize.ENUM("0", "1"),
        defaultValue: "1",
      },
    },
    {
      modelName: "StudentPlan",
      tableName: "toss_students_plans",
      timestamps: true,
    }
  );
  return StudentPlan;
};
