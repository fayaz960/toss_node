// User.model.js
module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      role: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references: {
          model: "toss_roles",
          key: "id",
        },
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      mobile: {
        type: Sequelize.STRING(12),
        allowNull: true,
      },
      profile_pic: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "toss_users",
      timestamps: true,
    }
  );

  return User;
};
