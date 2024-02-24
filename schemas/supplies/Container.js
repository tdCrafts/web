const mongoose = require("mongoose");

const supplyData = require("./supplyData");

const schema = new mongoose.Schema({
    ...supplyData,
    size: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model("Container", schema);
