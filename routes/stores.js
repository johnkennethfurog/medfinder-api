const store = require("../controllers/store");

const express = require("express");
const router = express.Router();

router.post("/find", store.find_store);

router.get("/medicines/:storeId", store.get_medicines);

router.get("/profile/:storeId", store.get_profile);

router.put("/profile/", store.update_profile);

router.post("/medicine", store.add_medicines);

router.delete("/medicine/:storeId/:medicineId", store.delete_medicine);

router.put("/medicine", store.update_medicine);

router.post("/avatar", store.upload_avatar);

router.post("/add", store.register_store);

router.put("/resetpassword", store.reset_store_password);

router.get("/", store.get_stores);

module.exports = router;
