const _ = require("lodash");

const Store = require("../models/store");
var ObjectId = require("mongodb").ObjectID;

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
  const storeId = ObjectId(req.params.storeId);

  Store.aggregate([
    {
      $match: {
        _id: storeId
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
    console.log(req.body);
    const { medicine, storeId } = req.body;

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
    console.log("error", req.body);

    const { medicines, storeId } = req.body;
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
    const storeId = req.params.storeId;

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
  const { Name, Location, Schedule, Address, ContactInfo, _id } = req.body;

  console.log("Schedule", Schedule);
  console.log("req.body", req.body);

  try {
    Store.findOneAndUpdate(
      {
        _id: ObjectId(_id)
      },
      {
        $set: {
          Name,
          Location,
          Schedule,
          Address,
          ContactInfo
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
  try {
    Store.findOne({
      _id: req.params.storeId
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
