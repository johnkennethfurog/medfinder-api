const mongoose = require("mongoose");
const config = require("../config.js");

const connectDB = async () => {
  console.log(config.mongoUrl);
  await mongoose.connect(config.mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  });
  console.log("Database connected...");
};

module.exports = connectDB;
