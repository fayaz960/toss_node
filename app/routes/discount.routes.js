const { verifySignUp } = require("../middleware");
const { authJwt } = require("../middleware");
const discount_controller = require("../controllers/discount/discount.controller");

module.exports = function (app) {
  app.post("/api/add_discount", [authJwt.verifyToken], discount_controller.addDiscountfunction);
  app.post("/api/get_discount", [authJwt.verifyToken], discount_controller.getDiscountList);
  app.post("/api/update_discount", [authJwt.verifyToken], discount_controller.updateDiscountfunction);
  app.post("/api/update_discount_status", [authJwt.verifyToken], discount_controller.updateDiscountStatus);
  app.post("/api/delete_discount", [authJwt.verifyToken], discount_controller.deleteDiscount);
};
