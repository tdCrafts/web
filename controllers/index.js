const express = require("express");
const router = express.Router();

const api = require("./api");
router.use("/api", api);

const calculator = require("./calculator");
router.use("/calculator", calculator);

router.get("/", (req, res) => {
    res.redirect("/calculator/candle");
});

module.exports = router;
