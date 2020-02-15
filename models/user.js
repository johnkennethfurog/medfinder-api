const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  Email: String,
  Password: String,
  Store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }
});

module.exports = mongoose.model("User", userSchema);
