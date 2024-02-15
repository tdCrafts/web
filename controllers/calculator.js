const express = require("express");
const router = express.Router();

const { CalculatorEntry } = require("../schemas");

router.get("/candle", (req, res) => {
    const user = req?.session?.user;
    console.log(req.session);
    console.log(user);
    res.render("pages/calculator/candle/new", {user});
});

router.get("/candle/:id", async (req, res) => {
    try {
        const user = req?.session?.user;
        console.log(req.session);
        console.log(user);
        const entry = await CalculatorEntry.findById(req.params.id);
        res.render("pages/calculator/candle/result", {entry, user});
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
