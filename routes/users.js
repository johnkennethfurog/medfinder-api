const express = require("express");
const router = express.Router();

const auth = require("../utils/auth");
const user = require("../controllers/user");

/* GET users listing. */
router.get("/user", function (req, res, next) {
  res.send("respond with a resource");
});

router.put("/changepassword", auth.validateToken, user.change_password);
router.put("/forgotpassword", user.forgot_password);

router.post("/signin", user.signin);

router.post("/admin", user.register_user);

module.exports = router;
