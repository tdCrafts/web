const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    owner: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        index: true,
        required: true,
    },
    entry: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "CalculatorEntry",
        index: true,
        required: true,
    }
}, {
    toJSON: {
        virtuals: true,
    }
});

module.exports = mongoose.model("CandleBatch", schema);
