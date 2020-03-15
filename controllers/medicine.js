const Medicine = require("../models/medicine");

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

exports.get_all = (req, res) => {
  Medicine.find({})
    .then(docs => {
      res.json({ statusCode: 200, message: "", data: docs });
    })
    .catch(error => {
      res.json({ statusCode: 500, message: error });
    });
};

exports.add_medicine = (req, res) => {
  const { GenericName, BrandName, Size, UoM, NeedPresription } = req.body;
  const { IsAdminAccount } = req.decoded;

  if (!IsAdminAccount) {
    this.status(403).json({
      message: "Invalid token"
    });
    return;
  }

  // GenericName: String,
  // BrandName: String,
  // Size: Number,
  // : String,
  // NeedPresription: Boolean

  const medicine = new Medicine();
  medicine.GenericName = GenericName;
  medicine.BrandName = BrandName;
  medicine.Size = Size;
  medicine.UoM = UoM;
  medicine.NeedPresription = NeedPresription;

  try {
    medicine
      .save()
      .then(doc => {
        res.status(200).json({
          data: doc
        });
      })
      .catch(error => {
        res.status(400).json({
          message: "Something went wrong while adding medicine.",
          data: error
        });
      });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while adding medicine."
    });
  }
};

exports.update_medicine = (req, res) => {
  const { GenericName, BrandName, Size, UoM, NeedPresription, _id } = req.body;
  const { IsAdminAccount } = req.decoded;

  if (!IsAdminAccount) {
    this.status(403).json({
      message: "Invalid token"
    });
    return;
  }

  try {
    Medicine.findOneAndUpdate(
      {
        _id
      },
      {
        $set: {
          GenericName,
          BrandName,
          Size,
          UoM,
          NeedPresription
        }
      },
      {
        new: true
      }
    )
      .then(doc => {
        res.status(200).json({
          data: doc
        });
      })
      .catch(error => {
        res.status(400).json({
          message: "Something went wrong while updating medicine.",
          data: error
        });
      });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while updating medicine."
    });
  }
};

exports.delete_medicine = (req, res) => {
  const _id = req.params.medicineId;
  const { IsAdminAccount } = req.decoded;

  if (!IsAdminAccount) {
    this.status(403).json({
      message: "Invalid token"
    });
    return;
  }

  try {
    Medicine.findByIdAndRemove({
      _id
    })
      .then(doc => {
        res.status(200).json({
          data: doc
        });
      })
      .catch(error => {
        res.status(400).json({
          message: "Something went wrong while removing medicine.",
          data: error
        });
      });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong while removing medicine."
    });
  }
};
