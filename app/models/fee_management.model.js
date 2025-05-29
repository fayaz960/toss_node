// Fee_Management.model.js
module.exports = (sequelize, Sequelize) => {
  const Fee_Management = sequelize.define(
    "Fee_Management",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      plan_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATE,
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
      discount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      paid_amount: {
        type: Sequelize.DOUBLE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("paid", "pending", "overdue"),
        defaultValue: "overdue",
      },
      payment_method: {
        type: Sequelize.ENUM("cash", "card", "upi", "bank"),
        allowNull: true,
      },
      collected_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      collected_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "fee_demanad",
      timestamps: false,
    }
  );

  return Fee_Management;
};
