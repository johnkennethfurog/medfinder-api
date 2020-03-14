const store = require("../controllers/store");
const auth = require("../utils/auth");

const express = require("express");
const router = express.Router();

router.post("/find", store.find_store);

router.get("/medicines", auth.validateToken, store.get_medicines);

router.get("/profile", auth.validateToken, store.get_profile);

router.put("/profile/", auth.validateToken, store.update_profile);

router.post("/medicine", auth.validateToken, store.add_medicines);

router.delete(
  "/medicine/:medicineId",
  auth.validateToken,
  store.delete_medicine
);

router.put("/medicine", auth.validateToken, store.update_medicine);

router.post("/avatar", store.upload_avatar);

router.post("/add", auth.validateToken, store.register_store);

router.put("/resetpassword", auth.validateToken, store.reset_store_password);

router.get("/", auth.validateToken, store.get_stores);

module.exports = router;
