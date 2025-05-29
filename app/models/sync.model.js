// Add_on.model.js
module.exports = (sequelize, Sequelize) => {
  const Sync = sequelize.define(
    "Sync",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      data: {
        type: Sequelize.BLOB("long"),
        allowNull: false,
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      modelName: "Sync",
      tableName: "sync",
      timestamps: false,
    }
  );

  return Sync;
};
