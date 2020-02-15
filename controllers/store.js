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
    { $project: { medicinesData: 0 } }
  ])
    .then(docs => {
      res.json({ data: docs });
    })
    .catch(err => {
      res.json({ statusCode: 500, message: err });
    });
};
