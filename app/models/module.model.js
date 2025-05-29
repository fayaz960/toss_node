// module.model.js
module.exports = (sequelize, Sequelize) => {
  const Module = sequelize.define(
    "Module",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      module_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "toss_modules",
      timestamps: true,
    }
  );

  return Module;
};
