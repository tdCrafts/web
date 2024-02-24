module.exports = {
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
    currentQuantity: Number,
    package: {
        url: String,
        size: Number,
        price: Number,
    },
    name: {
        type: String,
        required: true,
    },
}
