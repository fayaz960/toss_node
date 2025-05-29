const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage, 

  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true); 
    } else {
      cb(new Error("Only image files are allowed!")); 
    }
  },

  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

module.exports = upload;
