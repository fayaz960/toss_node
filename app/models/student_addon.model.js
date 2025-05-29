//StudentAddon Model
module.exports = (sequelize, Sequelize) => {
  const StudentAddon = sequelize.define(
    "StudentAddon",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      student_plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      add_on_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      modelName: "StudentAddon",
      tableName: "toss_student_addon",
      timestamps: false,
    }
  );
  return StudentAddon;
};
