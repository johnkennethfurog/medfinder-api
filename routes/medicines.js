const medicine = require("../controllers/medicine");

const express = require("express");
const router = express.Router();

router.get("/search/:keyword", medicine.search_medicine);

module.exports = router;
