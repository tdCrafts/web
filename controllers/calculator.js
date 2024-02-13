const express = require("express");
const router = express.Router();

const { CalculatorEntry } = require("../schemas");

router.get("/candle", (req, res) => {
    res.render("pages/calculator/candle/new");
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

router.get("/", (req, res) => {
    res.redirect("/calculator/candle");
});

module.exports = router;
