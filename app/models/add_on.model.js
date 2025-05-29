// Add_on.model.js
module.exports = (sequelize, Sequelize) => {
  const Add_on = sequelize.define(
    "Add_on",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      plan_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      plan_charge: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
    },
    {
      modelName: "Add_on",
      tableName: "toss_add_on",
      timestamps: true,
    }
  );

  return Add_on;
};
