const express = require("express");
const router = express.Router();

const { CalculatorEntry } = require("../schemas");

router.get("/candle", (req, res) => {
    res.send("nyi");
});

router.get("/candle/:id", async (req, res) => {
    try {
        const entry = await CalculatorEntry.findById(req.params.id);
        res.render("pages/calculator/candle/result", {entry});
        return;
    } catch(err) {
        console.error(err);
    }
    res.send("Unknown calc entry");
});

module.exports = router;
