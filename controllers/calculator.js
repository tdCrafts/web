const express = require("express");
const router = express.Router();

const { CalculatorEntry } = require("../schemas");

router.get("/candle", (req, res) => {
    const user = req?.session?.user;
    res.render("pages/calculator/candle/new", {user});
});

router.get("/candle/:id", async (req, res) => {
    const user = req?.session?.user;
    try {
        const entry = await CalculatorEntry.findById(req.params.id);
        if (entry) {
            if (entry.privacy !== "private" || (entry.isOwned && entry.isOwner(req?.session?.user?._id))) {
                const isReadOnly = entry.privacy === "readonly" && !entry.isOwner(req?.session?.user?._id);
                res.render("pages/calculator/candle/result", {entry, user, isReadOnly});
                return;
            }
        }
    } catch(err) {
        console.error(err);
    }
    res.render("pages/calculator/candle/404", {user});
});

router.get("/", (req, res) => {
    res.redirect("/calculator/candle");
});

module.exports = router;
