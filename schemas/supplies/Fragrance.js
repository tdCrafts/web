const mongoose = require("mongoose");

const supplyData = require("./supplyData");

const schema = new mongoose.Schema({
    ...supplyData,
});

module.exports = mongoose.model("Fragrance", schema);
