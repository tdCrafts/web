const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    buffer: {
        type: Number,
        default: null,
    },
    unit: {
        type: String,
        enum: ["g", "oz"],
        default: "oz",
    },
    fragrancePercent: {
        type: Number,
        default: 10,
    },
    containers: {
        type: [{name: String, quantity: Number, size: Number}],
        required: true,
    },
    waxes: {
        type: [{name: String, percent: Number}],
        default: [{name: "Wax 1", percent: 100}],
    },
    fragrances: {
        type: [{name: String, percent: Number}],
        default: [{name: "Fragrance 1", percent: 100}],
    },
    executed_at: {
        type: Date,
        default: Date.now,
    },
    last_used_at: {
        type: Date,
        default: Date.now,
    },
    uses: {
        type: Number,
        default: 0,
    }
}, {
    toJSON: {
        virtuals: true,
    }
});

schema.virtual("roundTo")
    .get(function() {
        return this.unit === "oz" ? 2 : 1;
    });

schema.virtual("totalSize")
    .get(function() {
        let totalSize = 0;
        this.containers.forEach(container => {
            totalSize += container.size * container.quantity;
        });
        return totalSize;
    });

schema.virtual("totalProduct")
    .get(function() {
        return this.totalSize + (this.buffer ? this.buffer : 0);
    });

schema.virtual("totalWax")
    .get(function() {
        return this.totalProduct * (100 - this.fragrancePercent) / 100;
    });

schema.virtual("totalFragrance")
    .get(function() {
        return this.totalProduct * this.fragrancePercent / 100;
    });

schema.virtual("longUnit")
    .get(function() {
        switch (this.unit) {
            case "oz":
                return "ounces";
            case "g":
                return "grams";
            default:
                return "unk";
        }
    });

schema.methods.use = async function() {
    this.last_used_at = Date.now();
    this.uses++;
    await this.save();
};

module.exports = mongoose.model("CalculatorEntry", schema);
