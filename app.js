const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const fileupload = require("express-fileupload");

const connectDB = require("./databases/connection");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const storeRouter = require("./routes/stores");
const medicineRouter = require("./routes/medicines");

const app = express();

connectDB();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  fileupload({
    useTempFiles: true
  })
);

//ROUTES
app.use("/", indexRouter);
app.use("/v1", usersRouter);
app.use("/v1/medicines", medicineRouter);
app.use("/v1/store", storeRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// state the server
// app.listen(process.env.PORT || config.port, function() {
//   console.log("Node HTTP server is listening to port " + config.port);
// });

module.exports = app;
