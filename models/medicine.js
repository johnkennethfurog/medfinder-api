const mongoose = require("mongoose");

const medicineSchema = mongoose.Schema(
  {
    GenericName: String,
    BrandName: String,
    Size: Number,
    UoM: String,
    NeedPresription: Boolean
  },
  { collection: "Medicine" }
);

module.exports = mongoose.model("Medicine", medicineSchema);
