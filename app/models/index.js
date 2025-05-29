"use strict";
const fs = require("fs");
const path = require("path");
const basename = path.basename(__filename);
const dbConfig = require("../config/db.config.js");
const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: false,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require("./user.model.js")(sequelize, Sequelize);
db.Role = require("./role.model.js")(sequelize, Sequelize);
db.Module = require("./module.model.js")(sequelize, Sequelize);
db.Discount = require("./discount.model.js")(sequelize, Sequelize);
db.Subscription = require("./subscription.model.js")(sequelize, Sequelize);
db.SubscriptionDays = require("./subscription_days.model.js")(
  sequelize,
  Sequelize
);
db.AddOn = require("./add_on.model.js")(sequelize, Sequelize);
db.Student = require("./student.model.js")(sequelize, Sequelize);
db.StudentPlan = require("./student_plan.model.js")(sequelize, Sequelize);
db.StudentAddon = require("./student_addon.model.js")(sequelize, Sequelize);
db.Country = require("./country.model.js")(sequelize, Sequelize);
db.Fee_Management = require("./fee_management.model.js")(sequelize, Sequelize);
db.Sync = require("./sync.model.js")(sequelize, Sequelize);
db.Attendance = require("./attendance.model.js")(sequelize, Sequelize);

// Define relationships
db.User.belongsTo(db.Role, {
  foreignKey: "role",
  targetKey: "id",
});
//---------------------

db.User.hasOne(db.Subscription, {
  foreignKey: "id",
  targetKey: "id",
});

db.Subscription.belongsTo(db.User, {
  foreignKey: "in_charge",
  targetKey: "id",
});

//---------------------
db.Student.hasOne(db.StudentPlan, {
  foreignKey: "student_id",
  targetKey: "id",
});

db.StudentPlan.belongsTo(db.Student, {
  foreignKey: "student_id",
  targetKey: "id",
});
//---------------------
db.Subscription.hasOne(db.StudentPlan, {
  foreignKey: "plan_id",
  sourceKey: "id",
});

db.StudentPlan.belongsTo(db.Subscription, {
  foreignKey: "plan_id",
  targetKey: "id",
});
//---------------------
db.StudentPlan.hasMany(db.StudentAddon, {
  foreignKey: "student_plan_id",
  as: "addon",
});
db.StudentAddon.belongsTo(db.StudentPlan, {
  foreignKey: "student_plan_id",
  as: "studentPlan",
});
//---------------------
db.AddOn.hasOne(db.StudentAddon, {
  foreignKey: "add_on_id",
  sourceKey: "id",
});

db.StudentAddon.belongsTo(db.AddOn, {
  foreignKey: "add_on_id",
  targetKey: "id",
});
//---------------------
db.Subscription.hasMany(db.SubscriptionDays, {
  foreignKey: "plan_id",
  sourceKey: "id",
});

db.SubscriptionDays.belongsTo(db.Subscription, {
  foreignKey: "plan_id",
  targetKey: "id",
});
//---------------------

db.Student.hasMany(db.Fee_Management, {
  foreignKey: "student_id",
  sourceKey: "id",
});

db.Fee_Management.belongsTo(db.Student, {
  foreignKey: "student_id",
  targetKey: "id",
});

//---------------------
db.StudentPlan.hasOne(db.Fee_Management, {
  foreignKey: "plan_id",
  sourceKey: "id",
});

db.Fee_Management.belongsTo(db.StudentPlan, {
  foreignKey: "plan_id",
  targetKey: "id",
});

//-----------------------
db.Discount.hasOne(db.StudentPlan, {
  foreignKey: "discount_id",
  sourceKey: "id",
});

db.StudentPlan.belongsTo(db.Discount, {
  foreignKey: "discount_id",
  targetKey: "id",
});

//-----------------------
db.Student.hasMany(db.Attendance, {
  foreignKey: "student_id",
});

db.Attendance.belongsTo(db.Student, {
  foreignKey: "student_id",
});

module.exports = db;
