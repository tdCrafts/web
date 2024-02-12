const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

router.use(bodyParser.json());

router.post("/candle/:id", (req, res) => {
    console.log(req.body);
    res.json({ok: true});
});

module.exports = router;
