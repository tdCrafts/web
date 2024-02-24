const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    owner: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        index: true,
        required: true,
    },
    privacy: {
        type: String,
        enum: ["readonly", "private"],
        default: "private",
    },
    fragranceNames: {
        type: [String],
        default: [],
    },
    calculation: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "CalculatorEntry",
        index: true,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    }
}, {
    toJSON: {
        virtuals: true,
    }
});

module.exports = mongoose.model("CandleBatch", schema);
