const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

const studentAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);

    const studentExists = await Student.exists({ _id: decoded.id });

    if (!studentExists) {
      return res
        .status(401)
        .json({ error: "Invalid token. Student not found." });
    }
    
    req.student = decoded;

    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};

module.exports = studentAuthMiddleware;
