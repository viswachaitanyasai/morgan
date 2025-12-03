const multer = require("multer");
require("dotenv").config();


const storage = multer.memoryStorage();
const upload = multer({ storage });


module.exports = {
  uploadMiddleware: upload.single("file")
};
