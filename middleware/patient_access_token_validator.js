const jwt = require("jsonwebtoken");

const patientAccessTokenValidator = async (req, res, next) => {
  try {
    let token;
    let authHeader = req.headers.Authorization || req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.DOC_ON_PATIENT_KEY, (err, decoded) => {
        if (err) {
         return res.status(401).json({
            title: "Unauthorized",
            message: "You are not authorized for this action",
          });
        } 
         req.patient = decoded.patient;
          next();
        
      });
    }else{
      return res.status(401).json({
            title: "Unauthorized",
            message: "Unaithorize Access. Please login with your credentials",
          });
    }
  } catch (e) {
    res.status(500).json({
      title: "Server Error",
      message: `Server Error: ${e}`,
    });
  }
};

module.exports = patientAccessTokenValidator;
