const User = require("../models/user");
const medcrypt = require("../utils/medcrypt");
const jwt = require("jsonwebtoken");

exports.change_password = (req, res) => {
  const { password, oldPassword } = req.body;
  const { userId } = req.decoded;

  User.findOne({ _id: userId })
    .then(doc => {
      if (doc) {
        const { Password, Salt } = doc;
        const isSame = medcrypt.compare(oldPassword, Password, Salt);
        const { passwordHash, salt } = medcrypt.encrypt(password);

        if (isSame) {
          User.findOneAndUpdate(
            { _id: doc._id },
            {
              Password: passwordHash,
              Salt: salt
            }
          )
            .then(() => {
              res.status(200).json({
                message: "Password changed successfully"
              });
            })
            .catch(err => {
              res.status(500).json({
                message: "Someting went wrong.",
                data: err
              });
            });
        } else {
          res.status(400).json({
            message: "Password is incorrect."
          });
        }
      } else {
        res.status(400).json({
          message: "User not found"
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        message: "Someting went wrong.",
        data: err
      });
    });
};

exports.signin = (req, res) => {
  const { email, pass } = req.body;

  User.findOne({
    Email: email
  })
    .select({ Email: 1, IsAdminAccount: 1, Password: 1, Salt: 1, Store: 1 })
    .then(doc => {
      if (doc) {
        const { Password, Salt } = doc;
        const isSame = medcrypt.compare(pass, Password, Salt);
        if (isSame) {
          const payload = {
            userId: doc._id,
            storeId: doc.Store,
            IsAdminAccount: doc.IsAdminAccount
          };

          doc.Password = undefined;
          doc.Salt = undefined;
          doc.Store = undefined;

          const authToken = jwt.sign(payload, process.env.JWT_KEY);

          res.status(200).json({
            message: "Login success",
            data: { user: doc, authToken }
          });
        } else {
          res.status(400).json({
            message: "Invalid username or password."
          });
        }
      } else {
        res.status(400).json({
          message: "User does not exist"
        });
      }
    })
    .catch(err => {
      console.log("error", err);
      res.status(500).json({
        message: "Somethig went wrong",
        data: err
      });
    });
};

exports.register_user = (req, res) => {
  const { Password, Email } = req.body;

  const { passwordHash, salt } = medcrypt.encrypt(Password);

  const user = new User();
  user.Email = Email;
  user.Password = passwordHash;
  user.Salt = salt;
  user.DefaultAccount = true;
  user.IsAdminAccount = true;

  user
    .save()
    .then(doc => {
      res.status(200).json({
        message: "registered!"
      });
    })
    .catch(error => {
      res.status(400).json({
        message: "Unable to create new user for store.",
        data: error
      });
    });
};