const express = require("express");
const router = express.Router();

const calculator = require("./calculator");
router.use("/calculator", calculator);

module.exports = router;
