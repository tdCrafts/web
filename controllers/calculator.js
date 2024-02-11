const express = require("express");
const router = express.Router();

const { CalculatorEntry } = require("../schemas");

router.get("/", (req, res) => {
    res.send("nyi");
});

router.get("/:id", async (req, res) => {
    try {
        const entry = await CalculatorEntry.findById(req.params.id);
        res.render("pages/calculator/result", {entry});
        return;
    } catch(err) {
        console.error(err);
    }
    res.send("Unknown calc entry");
});

module.exports = router;
