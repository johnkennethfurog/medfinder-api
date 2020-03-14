const jwt = require("jsonwebtoken");

exports.validateToken = (req, res, next) => {
  let token = req.headers["authorization"];
  console.log("token", token);
  if (token) {
    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          message: "Unauthorized access"
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.status(403).json({
      message: "Unauthorized access"
    });
  }
};
