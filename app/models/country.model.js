// Country.model.js
module.exports = (sequelize, Sequelize) => {
  const Country = sequelize.define(
    "Country",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      iso: {
        type: Sequelize.CHAR(2),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      nicename: {
        type: Sequelize.STRING(80),
        allowNull: false,
      },
      iso3: {
        type: Sequelize.CHAR(2),
        allowNull: true,
      },
      numcode: {
        type: Sequelize.SMALLINT,
        allowNull: true,
      },
      phonecode: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      modelName: "Country",
      tableName: "toss_country",
      timestamps: false,
    }
  );

  return Country;
};
