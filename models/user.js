const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  Email: { type: String, unique: true },
  Password: String,
  Salt: String,
  DefaultAccount: Boolean,
  IsAdminAccount: Boolean,
  Store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }
});

module.exports = mongoose.model("User", userSchema);
