// Subscription.model.js
module.exports = (sequelize, Sequelize) => {
  const Subscription = sequelize.define(
    "Subscription",
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
      from_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      to_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      in_charge: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      fee_collect_type: {
        type: Sequelize.ENUM("monthly", "weekly"),
        defaultValue: "monthly",
      },
      created_by: {
        type: Sequelize.INTEGER,
      },
    },
    {
      modelName: "Subscription",
      tableName: "toss_subscriptions",
      timestamps: true,
    }
  );

  return Subscription;
};
