const MongoClient = require("mongodb").MongoClient;
const express = require("express");
const router = express.Router();

const config = require("../config.js");

router.get("/medicines/search/:keyword", function (req, res) {
    MongoClient.connect(
        config.mongoUrl,
        { useNewUrlParser: true, useUnifiedTopology: true },
        function (err, client) {
            if (err) {
                res.send(err);
            }

            const db = client.db("MedFind").collection("Medicine");
            db.find({ GenericName: { '$regex': `^${req.params.keyword}`, '$options': 'i' } }).toArray(function (err, results) {
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