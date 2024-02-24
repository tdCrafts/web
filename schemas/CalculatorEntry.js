const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    owner: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User",
        index: true,
        default: null,
    },
    privacy: {
        type: String,
        enum: ["public","private","readonly"],
        default: "public",
    },
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
    copiedFrom: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "CalculatorEntry",
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

schema.virtual("isOwned")
    .get(function() {
        return Boolean(this.owner);
    });

schema.methods.isOwner = function(userId) {
    if (!this.isOwned) return false;
    
    if (this?.owner?._id) {
        return String(this?.owner?._id) === String(userId);
    } else {
        return String(this?.owner) === String(userId);
    }
}

schema.methods.cloneEntry = async function(newOwner = null) {
    const newEntry = await this.constructor.create({
        owner: newOwner ? newOwner : this.owner,
        privacy: newOwner ? "readonly" : this.privacy,
        buffer: this.buffer,
        unit: this.unit,
        fragrancePercent: this.fragrancePercent,
        containers: this.containers,
        waxes: this.waxes,
        fragrances: this.fragrances,
        copiedFrom: this,
    });
    return newEntry;
}

schema.methods.use = async function() {
    this.last_used_at = Date.now();
    this.uses++;
    await this.save();
};

module.exports = mongoose.model("CalculatorEntry", schema);
