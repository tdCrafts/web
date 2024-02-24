const express = require("express");
const router = express.Router();

const { Activity, CalculatorEntry } = require("../schemas");

const relativeTime = time => {
    time = time / 1000; // convert ms to s
    if (time >= 604800) {
        let result = (time / 604800).toFixed(1);
        return `${result} week${result === "1.0" ? "" : "s"} ago`;
    } else if (time >= 86400) {
        let result = (time / 86400).toFixed(1);
        return `${result} day${result === "1.0" ? "" : "s"} ago`;
    } else if (time >= 3600) {
        let result = (time / 3600).toFixed(1);
        return `${result} hour${result === "1.0" ? "" : "s"} ago`;
    } else if (time >= 60) {
        let result = (time / 60).toFixed(1);
        return `${result} minute${result === "1.0" ? "" : "s"} ago`;
    } else {
        return `less than one minute ago`;
    }
}

router.get("/candle", async (req, res) => {
    const user = req?.session?.user;
    let recentCalculations = [];
    let recentBatches = [];
    if (user) {
        recentCalculations = await Activity.getUserActivity(user, "candleEntry", 5);
        recentBatches = await Activity.getUserActivity(user, "candleBatch", 5);
    }
    res.render("pages/calculator/candle/new", {user, recentCalculations, recentBatches, relativeTime});
});

router.get("/candle/:id", async (req, res) => {
    const user = req?.session?.user;
    try {
        const entry = await CalculatorEntry.findById(req.params.id);
        if (entry) {
            if (entry.privacy !== "private" || (entry.isOwned && entry.isOwner(user?._id))) {
                const isReadOnly = entry.privacy === "readonly" && !entry.isOwner(user?._id);
                let recentCalculations = [];
                let recentBatches = [];
                if (user) {
                    await Activity.create({user, candleEntry: entry});
                    recentCalculations = await Activity.getUserActivity(user, "candleEntry", 5);
                    recentBatches = await Activity.getUserActivity(user, "candleBatch", 5);
                }
                res.render("pages/calculator/candle/edit", {entry, user, recentCalculations, recentBatches, isReadOnly, relativeTime});
                return;
            }
        }
    } catch(err) {
        console.error(err);
    }
    res.render("pages/calculator/candle/404", {user});
});

router.get("/candle/:id/create-batch", async (req, res) => {
    const user = req?.session?.user;
    try {
        const entry = await CalculatorEntry.findById(req.params.id);
        if (entry) {
            if (entry.isOwned && entry.isOwner(user?._id)) {
                res.render("pages/calculator/candle/createBatch", {entry, user});
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
