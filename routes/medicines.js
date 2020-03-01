const medicine = require("../controllers/medicine");

const express = require("express");
const router = express.Router();

router.get("/search/:keyword", medicine.search_medicine);

router.get("/all", medicine.get_all);

router.post("/", medicine.add_medicine);
router.put("/", medicine.update_medicine);
router.delete("/:medicineId", medicine.delete_medicine);

module.exports = router;
