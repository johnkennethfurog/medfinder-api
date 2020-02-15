const store = require("../controllers/store");

const express = require("express");
const router = express.Router();

router.post("/find", store.find_store);
module.exports = router;
