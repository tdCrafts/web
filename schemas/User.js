const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT_WORK_FACTOR = 10;

const schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true,
    },
    username: {
        type: String,
        required: true,
        index: {
            unique: true,
        },
    },
    password: String,
    discordId: String,
});

schema.pre("save", function(next) {
    if (!this.isModified("password")) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if (err) return next(err);

        bcrypt.hash(this.password, salt, function(err, hash) {
            if (err) return next(err);

            this.password = hash;
            next();
        });
    });
});

schema.methods.comparePassword = function(candidatePassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
            if (err) return reject(err);
            resolve(isMatch);
        });
    });
}

module.exports = mongoose.model("User", schema);
