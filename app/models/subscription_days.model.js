// Subscription_Days.model.js
module.exports = (sequelize, Sequelize) => {
  const Subscription_Days = sequelize.define(
    "Subscription_Days",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      day: {
        type: Sequelize.ENUM(
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday"
        ),
      },
    },
    {
      modelName: "Subscription_Days",
      tableName: "toss_subscriptions_days",
      timestamps: false,
    }
  );

  return Subscription_Days;
};
