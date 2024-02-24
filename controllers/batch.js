const express = require("express");
const router = express.Router();

const {CandleBatch} = require("../schemas");

router.use((req, res, next) => {
    if (req.session?.user?._id) {
        next();
    } else {
        res.redirect("/account/login");
    }
});

router.get("/candle", async (req, res) => {
    const user = req.session.user;
    const batches = await CandleBatch.find({owner: user._id}).populate(["calculation"]);
    res.render("pages/batch/candle/all", {batches, user});
})

module.exports = router;
