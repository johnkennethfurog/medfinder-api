const mongoose = require("mongoose");

const storeSchema = mongoose.Schema(
  {
    Name: String,
    Address: String,
    IsHealthCentre: Boolean,
    Location: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] }
    },
    Admin: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    Schedule: {
      mon: { from: String, to: String },
      tue: { from: String, to: String },
      wed: { from: String, to: String },
      thu: { from: String, to: String },
      fri: { from: String, to: String },
      sat: { from: String, to: String },
      sun: { from: String, to: String }
    },
    Medicines: [
      {
        MedicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine"
        },
        MinSrp: Number,
        MaxSrp: Number,
        Qty: Number
      }
    ]
  },
  { collection: "Store" }
);

storeSchema.index({ Location: "2dsphere" });
module.exports = mongoose.model("Store", storeSchema);
