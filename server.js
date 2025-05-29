const express = require("express");
require("express-async-errors");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
// const swaggerUi = require("swagger-ui-express");
// const swaggerSpec = require("./app/config/swagger-config");
// const YAML = require("yamljs");
// const swaggerDocument = YAML.load("./swagger.yaml");
const path = require("path");

// var corsOptions = {
//   origin: "http://localhost:8001"
// };
// app.use(cors(corsOptions));
// parse requests of content-type - application/json

require("dotenv").config();
app.use(express.json({ limit: "1000MB" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
global.__basedir = __dirname;

const db = require("./app/models");
// db.sequelize.sync({ force: false })
//   .then(() => {
//     console.log("Synced db.");
//   })
//   .catch((err) => {
//     console.log("Failed to sync db: " + err.message);
//   });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to TOSS Academy Application." });
});
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Define routes files
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/discount.routes")(app);
require("./app/routes/subscription.routes")(app);
require("./app/routes/add_on.routes")(app);
require("./app/routes/student.routes")(app);
require("./app/routes/fee_management.routes")(app);
require("./app/routes/dashboard.routes")(app);
require("./app/routes/report.routes")(app);
require("./app/routes/sync.routes")(app);
require("./app/routes/attendance.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
  // console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
