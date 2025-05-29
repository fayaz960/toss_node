// Discount.model.js
module.exports = (sequelize, Sequelize) => {
  const Discount = sequelize.define(
    "Discount",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      discount_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      discount_type: {
        type: Sequelize.ENUM("fixed", "percentage"),
        defaultValue: "fixed",
      },
      rate: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("0", "1"),
        defaultValue: "1",
      },
    },
    {
      modelName: "Discount",
      tableName: "toss_discount",
      timestamps: true,
    }
  );

  return Discount;
};
