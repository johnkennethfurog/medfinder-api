const MongoClient = require("mongodb").MongoClient;
var ObjectId = require("mongodb").ObjectID;

const express = require("express");
const router = express.Router();
//const config = require(path.resolve("config.js"));
const config = require("../config.js");

// router.post("/store/nearest", function (req, res) {
//     MongoClient.connect(
//         config.mongoUrl,
//         { useNewUrlParser: true, useUnifiedTopology: true },
//         function (err, client) {
//             if (err) {
//                 res.send(err);
//             }

//             console.log(req.body);

//             const db = client.db("MedFind").collection("Store");
//             db.aggregate([{ $geoNear: { near: { type: "Point", coordinates: [121.122218, 14.303993] }, distanceField: "distance", spherical: true, "distanceMultiplier": 0.001 } }]).toArray(function (err, results) {
//                 if (err) {
//                     res.send(err);
//                 }
//                 if (results.length > 0) {
//                     res.json({ statusCode: 200, message: "", data: results })
//                 } else {
//                     res.json({ statusCode: 401, message: "No available medicine" });
//                 }
//             });
//         }
//     );
// });

router.post("/store/medicine/", function (req, res) {
    MongoClient.connect(
        config.mongoUrl,
        { useNewUrlParser: true, useUnifiedTopology: true },
        function (err, client) {
            if (err) {
                res.send(err);
            }

            const objectIds = req.body.medicinesId.map(x => ObjectId(x));
            // console.log('config', config.mongoUrl);

            const db = client.db("MedFind").collection("Store");
            db.aggregate([
                {
                    // calculate the distace from users location
                    $geoNear: {
                        near: { type: "Point", coordinates: req.body.location },
                        distanceField: "distance",
                        spherical: true,
                        "distanceMultiplier": 0.001,
                        // fliter to include only store that contains medicine that we are searchig
                        query: { "Medicines.MedicineId": { $in: objectIds } }
                    }
                },
                // { $match: { "Medicines.MedicineId": { $in: objectIds } } },

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
                                cond: { $in: ["$$medicine.MedicineId", objectIds] }
                            }
                        }
                    }

                },
                // Get medicine info from Medicine collection = **left join result
                {

                    $lookup:
                    {
                        from: 'Medicine',
                        localField: 'Medicines.MedicineId',
                        foreignField: '_id',
                        as: 'medicinesData'
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
                                        { $arrayElemAt: [{ $filter: { input: "$medicinesData", as: "medicineData", cond: { $eq: ["$$medicine.MedicineId", "$$medicineData._id"] } } }, 0] }
                                    ]
                                }

                            }
                        }

                    },

                },
                // hide **left join result
                { $project: { medicinesData: 0 } }]).toArray(function (err, results) {
                    if (err) {
                        res.send(err);
                    }
                    if (results.length > 0) {
                        res.json({ statusCode: 200, message: "", data: results })
                    } else {
                        res.json({ statusCode: 401, message: "No available medicine" });
                    }
                });
        }
    );
});

module.exports = router;