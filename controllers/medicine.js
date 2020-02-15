const Medicine = require("../models/medicine");
var ObjectId = require("mongodb").ObjectID;

exports.search_medicine = (req, res) => {
  Medicine.find({
    $or: [
      { GenericName: { $regex: `^${req.params.keyword}`, $options: "i" } },
      { BrandName: { $regex: `^${req.params.keyword}`, $options: "i" } }
    ]
  })
    .then(docs => {
      if (docs.length > 0) {
        res.json({ statusCode: 200, message: "", data: docs });
      } else {
        res.json({ statusCode: 401, message: "No available medicine" });
      }
    })
    .catch(error => {
      res.json({ statusCode: 500, message: error });
    });
};
