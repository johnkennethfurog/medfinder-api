const express = require("express");
const router = express.Router();

const auth = require("../utils/auth");
const medicine = require("../controllers/medicine");

router.get("/search/:keyword", medicine.search_medicine);

router.get("/all", medicine.get_all);

router.post("/", auth.validateToken, medicine.add_medicine);
router.put("/", auth.validateToken, medicine.update_medicine);
router.delete("/:medicineId", auth.validateToken, medicine.delete_medicine);

module.exports = router;
