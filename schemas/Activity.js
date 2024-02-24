const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    user: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        index: true,
        required: true,
    },
    candleEntry: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "CalculatorEntry",
    },
    candleBatch: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "CandleBatch",
    },
    action: {
        type: String,
        enum: ["view", "edit", "create", "delete"],
        default: "view",
    },
    time: {
        type: Date,
        default: Date.now,
    }
}, {
    toJSON: {
        virtuals: true,
    }
});

schema.statics.getUserActivity = async function(user, type = null, limit = 5) {
    const data = {user};
    if (type && ["candleEntry", "candleBatch"].includes(type)) {
        data[type] = {$ne: null};
    }
    const recentEntries = await this.find(data)
        .limit(50)
        .populate(["candleEntry", "candleBatch"])
        .sort({time: -1});
    const endingEntries = [];
    recentEntries.forEach(entry => {
        if (endingEntries.length >= limit) return;
        if (entry?.candleEntry) {
            if (endingEntries.find(x => x.candleEntry && String(x.candleEntry._id) === String(entry.candleEntry._id))) {
                return;
            }
        }
        if (entry?.candleBatch) {
            if (endingEntries.find(x => x.candleBatch && String(x.candleBatch._id) === String(entry.candleBatch._id))) {
                return;
            }
        }

        if (!entry?.candleEntry?._id && !entry?.candleBatch?._id) {
            return; // ignore any deleted or unretrievable batches 
        }
        endingEntries.push(entry);
    });
    return endingEntries;
}

module.exports = mongoose.model("Activity", schema);
