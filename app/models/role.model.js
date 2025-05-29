// Role.model.js
module.exports = (sequelize, Sequelize) => {
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      role_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      module_privileges: {
        type: Sequelize.JSON,
        allowNull: true,
      },
    },
    {
      modelName: "Role",
      tableName: "toss_roles",
      timestamps: true,
    }
  );

  return Role;
};
