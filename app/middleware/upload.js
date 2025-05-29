const util = require("util");
const multer = require("multer");
const maxSize = 211 * 1024 * 1024;
const whitelist = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __basedir + "/resources/uploads/");
  },
  filename: (req, file, cb) => {
    // console.log(file); 
    // cb(null, file.originalname);  mimetype
    // cb(null,  Date.now() + ".xlsx")
    cb(null,  req.fileName)
  } 
});

const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format."), false); // if validation failed then generate error
    }
  };
let uploadFile = multer({
  storage: storage,
  limits: { fileSize: 10000000 },
  fileFilter: fileFilter
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;