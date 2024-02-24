const express = require("express");
const router = express.Router();

const batch = require("./batch");
router.use("/batch", batch);

const calculator = require("./calculator");
router.use("/calculator", calculator);

module.exports = router;
