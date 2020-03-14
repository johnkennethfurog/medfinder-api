const ObjectId = require("mongodb").ObjectID;
const Store = require("../models/store");
const User = require("../models/user");
const config = require("../config.js");
const _ = require("lodash");
const cloudinary = require("cloudinary").v2;
const generatePassword = require("password-generator");
const nodemailer = require("nodemailer");
const medcrypt = require("../utils/medcrypt");

cloudinary.config({
  cloud_name: config.cloudinary_name,
  api_key: config.cloudinary_key,
  api_secret: config.cloudinary_secret
});

exports.find_store = (req, res) => {
  const medicineIds = req.body.medicinesId.map(x => ObjectId(x));
  Store.aggregate([
    {
      // calculate the distace from users location
      $geoNear: {
        near: { type: "Point", coordinates: req.body.location },
        distanceField: "distance",
        spherical: true,
        distanceMultiplier: 0.001,
        // fliter to include only store that contains medicine that we are searchig
        query: { "Medicines.MedicineId": { $in: medicineIds } }
      }
    },

    // filters STORE medicine to include only medicine that we are searching
    {
      $project: {
        Name: 1,
        Address: 1,
        ContactInfo: 1,
        IsHealthCentre: 1,
        Location: 1,
        Schedule: 1,
        distance: 1,
        Medicines: {
          $filter: {
            input: "$Medicines",
            as: "medicine",
            cond: { $in: ["$$medicine.MedicineId", medicineIds] }
          }
        }
      }
    },
    // Get medicine info from Medicine collection = **left join result
    {
      $lookup: {
        from: "Medicine",
        localField: "Medicines.MedicineId",
        foreignField: "_id",
        as: "medicinesData"
      }
    },
    // create new field that will contain merge data from **left join result and filtered store medicine
    {
      $addFields: {
        Medicines: {
          $map: {
            input: "$Medicines",
            as: "medicine",
            in: {
              $mergeObjects: [
                "$$medicine",
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$medicinesData",
                        as: "medicineData",
                        cond: {
                          $eq: ["$$medicine.MedicineId", "$$medicineData._id"]
                        }
                      }
                    },
                    0
                  ]
                }
              ]
            }
          }
        }
      }
    },
    // hide **left join result
    {
      $project: {
        medicinesData: 0
      }
    }
  ])
    .then(docs => {
      res.json({ data: docs });
    })
    .catch(err => {
      res.json({ statusCode: 500, message: err });
    });
};

exports.get_medicines = (req, res) => {
  const { storeId } = req.decoded;

  console.log("req.decoded", req.decoded);
  console.log("storeId", storeId);

  Store.aggregate([
    {
      $match: {
        _id: ObjectId(storeId)
      }
    },
    {
      $project: {
        Medicines: 1
      }
    },
    {
      $lookup: {
        from: "Medicine",
        localField: "Medicines.MedicineId",
        foreignField: "_id",
        as: "medicinesData"
      }
    },

    // create new field that will contain merge data from **left join result and filtered store medicine
    {
      $addFields: {
        Medicines: {
          $map: {
            input: "$Medicines",
            as: "medicine",
            in: {
              $mergeObjects: [
                "$$medicine",
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$medicinesData",
                        as: "medicineData",
                        cond: {
                          $eq: ["$$medicine.MedicineId", "$$medicineData._id"]
                        }
                      }
                    },
                    0
                  ]
                }
              ]
            }
          }
        }
      }
    },
    // hide **left join result
    {
      $project: {
        medicinesData: 0
      }
    }
  ])
    .then(docs => {
      const store = docs[0];
      if (store) {
        res.json({
          statusCode: 200,
          data: store
        });
      } else {
        res.status(404).json({
          message: "Store not found"
        });
      }
    })
    .catch(err => {
      res.json({
        statusCode: 500,
        data: err
      });
    });
};

exports.update_medicine = (req, res) => {
  try {
    const { medicine } = req.body;
    const { storeId } = req.decoded;

    Store.findOneAndUpdate(
      {
        "Medicines.MedicineId": medicine.MedicineId,
        _id: storeId
      },
      { $set: { "Medicines.$": medicine } },
      {
        upsert: true,
        new: true,
        useFindAndModify: false
      }
    )
      .then(docs => {
        res.json({
          statusCode: 200,
          data: docs.value
        });
      })
      .catch(error => {
        console.log(error);
        res.json({
          status: 400,
          message: error,
          data: null
        });
      });
  } catch (error) {
    console.log(error);
    res.json({
      status: 400,
      message: error,
      data: null
    });
  }
};

exports.add_medicines = (req, res) => {
  try {
    const { medicines } = req.body;
    const { storeId } = req.decoded;

    Store.findOneAndUpdate(
      { _id: storeId },
      { $push: { Medicines: medicines } },
      {
        upsert: true,
        new: true,
        useFindAndModify: false
      }
    )
      .then(docs => {
        res.json({
          statusCode: 200,
          data: docs.value
        });
      })
      .catch(error => {
        res.json({
          status: 400,
          message: error,
          data: null
        });
      });
  } catch (error) {
    console.log("error", error);
    res.json({
      status: 400,
      message: error,
      data: null
    });
  }
};

exports.delete_medicine = (req, res) => {
  try {
    const medicineId = req.params.medicineId;
    const { storeId } = req.decoded;

    Store.update(
      {
        _id: ObjectId(storeId)
      },
      {
        $pull: {
          Medicines: { MedicineId: ObjectId(medicineId) }
        }
      },
      {
        multi: true
      }
    )
      .then(docs => {
        res.json({
          statusCode: 200,
          data: docs.value,
          message: "Medicine deleted"
        });
      })
      .catch(error => {
        res.json({
          status: 400,
          message: error,
          data: null
        });
      });
  } catch (error) {
    res.json({
      status: 400,
      message: error,
      data: null
    });
  }
};

exports.update_profile = (req, res) => {
  const { Name, Location, Schedule, Address, ContactInfo, Avatar } = req.body;

  const { storeId } = req.decoded;

  console.log("Schedule", Schedule);
  console.log("req.body", req.body);

  try {
    Store.findOneAndUpdate(
      {
        _id: storeId
      },
      {
        $set: {
          Name,
          Location,
          Schedule,
          Address,
          ContactInfo,
          Avatar
        }
      },
      {
        new: true
      }
    )
      .select({ Medicines: 0 })
      .then(docs => {
        console.log("docs", docs);
        res.json({
          statusCode: 200,
          data: docs
        });
      })
      .catch(err => {
        res.status(400).json({
          statusCode: 400,
          message: "Something went wrong while getting store profile"
        });
      });
  } catch (ex) {
    res.status(500).json({
      statusCode: 500,
      message: "Something went wrong while getting store profile"
    });
  }
};

exports.get_profile = (req, res) => {
  const { storeId } = req.decoded;

  try {
    Store.findOne({
      _id: storeId
    })
      .select({ Medicines: 0 })
      .then(docs => {
        res.json({
          statusCode: 200,
          data: docs
        });
      })
      .catch(err => {
        res.status(400).json({
          statusCode: 400,
          message: "Something went wrong while getting store profile"
        });
      });
  } catch (ex) {
    res.status(500).json({
      statusCode: 500,
      message: "Something went wrong while getting store profile"
    });
  }
};

exports.upload_avatar = (req, res) => {
  const public_id = req.body.public_id;
  const file = req.files.photo;

  if (public_id) {
    cloudinary.uploader.destroy(public_id).catch(error => {});
  }

  cloudinary.uploader
    .upload(file.tempFilePath)
    .then(function(uploadedFile) {
      res.status(200).json({
        data: { url: uploadedFile.url, public_id: uploadedFile.public_id }
      });
    })
    .catch(function(error) {
      res.status(500).json({
        message: "Unable to upload photo"
      });
    });
};

exports.get_stores = (req, res) => {
  const { IsAdminAccount } = req.decoded;

  if (!IsAdminAccount) {
    this.status(403).json({
      message: "Invalid token"
    });
    return;
  }

  Store.find({})
    .select({ Medicines: 0, Schedule: 0, Location: 0 })
    .then(docs => {
      res
        .status(200)
        .json({
          data: docs
        })
        .catch(err => {
          res.status(400).json({
            message: "Unable to get stores",
            data: err
          });
        });
    });
};

exports.register_store = (req, res) => {
  const { IsHealthCentre, Address, Name, Email, ContactInfo } = req.body;
  const { IsAdminAccount } = req.decoded;

  if (!IsAdminAccount) {
    this.status(403).json({
      message: "Invalid token"
    });
    return;
  }

  Password = generatePassword(8, true);
  const { passwordHash, salt } = medcrypt.encrypt(Password);

  const user = new User();
  user.Email = Email;
  user.Password = passwordHash;
  user.Salt = salt;
  user.DefaultAccount = true;
  user.ContactInfo = ContactInfo;
  user.IsAdminAccount = false;

  user
    .save()
    .then(user => {
      const store = new Store();
      store.IsHealthCentre = IsHealthCentre;
      store.Name = Name;
      store.Address = Address;
      store.Admin = [user._id];
      store
        .save()
        .then(doc => {
          user.Store = doc._id;
          user
            .save()
            .then(rspns => {
              sendEmail(
                "Med-Finder account created!",
                Email,
                `Your med-finder account password is : ${Password}`
              )
                .then(rspns => {
                  console.log("rspns", rspns);
                  res.status(200).json({
                    data: doc
                  });
                })
                .catch(err => {
                  console.log("err", err);
                  res.status(200).json({
                    data: doc,
                    message: "email not sent"
                  });
                });
            })
            .catch(err => {
              res.status(400).json({
                message: "failed linking user to store",
                data: err
              });
            });
        })
        .catch(err => {
          res.status(400).json({
            message: "Unable to create new store.",
            data: err
          });
        });
    })
    .catch(error => {
      res.status(400).json({
        message: "Unable to create new user for store.",
        data: err
      });
    });
};

exports.reset_store_password = (req, res) => {
  const { storeId } = req.body;
  const { IsAdminAccount } = req.decoded;

  if (!IsAdminAccount) {
    this.status(403).json({
      message: "Invalid token"
    });
    return;
  }

  Password = generatePassword(8, true);
  const { passwordHash, salt } = medcrypt.encrypt(Password);

  User.findOneAndUpdate(
    { Store: storeId, DefaultAccount: true },
    {
      $set: {
        Password: passwordHash,
        Salt: salt
      }
    }
  )
    .then(doc => {
      console.log("doc", doc);
      if (doc) {
        sendEmail(
          "Your Med-Finder account's password has been reset!",
          doc.Email,
          `Your new med-finder account password is : ${Password}`
        )
          .then(rspns => {
            res.status(200).json({
              message: "Success"
            });
          })
          .catch(err => {
            console.log("err", err);
            res.status(200).json({
              data: doc,
              message: "email not sent"
            });
          });
      } else {
        res.status(404).json({
          message: "Store not found."
        });
      }
    })
    .catch(err => {
      res.status(400).json({
        message: "Unable to retrieve default account for store",
        data: err
      });
    });
};

sendEmail = (subject, email, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "medfinder.noreply@gmail.com",
      pass: "Kenneth18!"
    }
  });

  const mailOptions = {
    from: "medfinder.noreply@gmail.com", // sender address
    to: email, // list of receivers
    subject, // Subject line
    html: message // plain text body
  };

  return transporter.sendMail(mailOptions);
};
