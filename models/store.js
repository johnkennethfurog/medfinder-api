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
      mon: { From: String, To: String },
      tue: { From: String, To: String },
      wed: { From: String, To: String },
      thu: { From: String, To: String },
      fri: { From: String, To: String },
      sat: { From: String, To: String },
      sun: { From: String, To: String }
    },
    Medicines: [
      {
        MedicineId: mongoose.Schema.Types.ObjectId,
        Srp: Number,
        Margin: Number,
        Qty: Number
      }
    ],
    ContactInfo: String
  },
  { collection: "Store" }
);

storeSchema.index({ Location: "2dsphere" });
module.exports = mongoose.model("Store", storeSchema);
